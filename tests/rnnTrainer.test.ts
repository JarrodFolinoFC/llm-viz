import { describe, it, expect } from 'vitest';
import {
  forwardPass,
  backwardPass,
  initRnn,
  rnnStrategy,
  type RnnModel,
} from '../src/training/strategies/rnn';
import type { Block } from 'mlblocks/core';
import { trainingBlocks } from 'mlblocks/core';
import { StepTrainer } from 'mlblocks/core';
import { CORPUS_8, CORPUS_22 } from '../src/lib/corpora';

const vocab = [...new Set(CORPUS_8.split(' '))];

function clone(m: RnnModel): RnnModel {
  return {
    E: m.E.map((r) => r.slice()),
    Wxh: m.Wxh.map((r) => r.slice()),
    Whh: m.Whh.map((r) => r.slice()),
    bh: m.bh.slice(),
    Why: m.Why.map((r) => r.slice()),
    by: m.by.slice(),
  };
}

const blockLoss = (m: RnnModel, b: Block) => {
  const { probs } = forwardPass(m, b.context);
  return -Math.log(Math.max(probs[b.target], 1e-12));
};

const meanLoss = (m: RnnModel, blocks: Block[]) => rnnStrategy.loss(m, blocks);

describe('RnnStrategy', () => {
  it('drives the cross-entropy loss down over training', () => {
    const blocks = trainingBlocks(CORPUS_8, vocab, 3);
    const model = initRnn(1, vocab.length, 1, 6);
    const before = meanLoss(model, blocks);

    let r = new StepTrainer(blocks, 0, model, rnnStrategy).doStep(0, 0.3);
    for (let i = 0; i < 400; i++) {
      r = new StepTrainer(blocks, r.step, r.after, rnnStrategy).doStep(blocks.length, 0.3);
    }
    const after = meanLoss(r.after, blocks);

    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(1.0); // the small corpus is learnable to low loss
  });

  it('learns the d=1 / blockSize=3 / 22-token corpus used by the page', () => {
    const v = [...new Set(CORPUS_22.split(' '))];
    const blocks = trainingBlocks(CORPUS_22, v, 3);
    const model = initRnn(1, v.length, 1, 6);
    const before = meanLoss(model, blocks);
    let r = new StepTrainer(blocks, 0, model, rnnStrategy).doStep(0, 0.2);
    for (let i = 0; i < 500; i++) {
      r = new StepTrainer(blocks, r.step, r.after, rnnStrategy).doStep(blocks.length, 0.2);
    }
    expect(v.length).toBe(22);
    expect(meanLoss(r.after, blocks)).toBeLessThan(before);
  });

  it('backprop-through-time matches the numerical gradient (central differences)', () => {
    const model = initRnn(7, vocab.length, 2, 4);
    const block: Block = { context: [1, 3, 0, 2], target: 4 };
    const grads = backwardPass(model, block, forwardPass(model, block.context));

    const eps = 1e-5;
    const numeric = (read: (m: RnnModel) => number, write: (m: RnnModel, x: number) => void) => {
      const base = read(model);
      const plus = clone(model);
      write(plus, base + eps);
      const minus = clone(model);
      write(minus, base - eps);
      return (blockLoss(plus, block) - blockLoss(minus, block)) / (2 * eps);
    };

    // A representative entry from every parameter tensor — including the
    // recurrent W_hh, whose gradient only comes out right if BPTT walks the chain.
    expect(numeric((m) => m.Why[1][2], (m, x) => (m.Why[1][2] = x))).toBeCloseTo(grads.dWhy[1][2], 6);
    expect(numeric((m) => m.Wxh[1][3], (m, x) => (m.Wxh[1][3] = x))).toBeCloseTo(grads.dWxh[1][3], 6);
    expect(numeric((m) => m.Whh[2][1], (m, x) => (m.Whh[2][1] = x))).toBeCloseTo(grads.dWhh[2][1], 6);
    // Embedding row of a context token (id 1 sits in the first context slot).
    expect(numeric((m) => m.E[1][0], (m, x) => (m.E[1][0] = x))).toBeCloseTo(grads.dE[1][0], 6);
  });

  it('flash snapshot exposes the worked example forward + gradients', () => {
    const blocks = trainingBlocks(CORPUS_8, vocab, 3);
    const model = initRnn(2, vocab.length, 1, 6);
    const r = new StepTrainer(blocks, 0, model, rnnStrategy).doStep(1, 0.3);
    expect(r.flash).not.toBeNull();
    expect(r.flash!.forward.hiddens).toHaveLength(3); // one hidden state per step
    expect(r.flash!.forward.hN).toHaveLength(6); // hidden width H
    expect(r.flash!.context).toHaveLength(3);
    // The output gradient is a valid (p − y): it sums to ~0.
    expect(r.flash!.grads.dLogits.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 8);
  });
});
