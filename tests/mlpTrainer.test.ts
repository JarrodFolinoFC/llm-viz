import { describe, it, expect } from 'vitest';
import {
  forwardPass,
  backwardPass,
  initMlp,
  mlpStrategy,
  type MlpModel,
} from '../src/training/strategies/mlp';
import type { Block } from 'mlblocks/core';
import { trainingBlocks, meanBlockLoss } from 'mlblocks/core';
import { StepTrainer } from 'mlblocks/core';
import { CORPUS_8, CORPUS_22 } from '../src/lib/corpora';

const vocab = [...new Set(CORPUS_8.split(' '))];

function clone(m: MlpModel): MlpModel {
  return {
    E: m.E.map((r) => r.slice()),
    W1: m.W1.map((r) => r.slice()),
    b1: m.b1.slice(),
    W2: m.W2.map((r) => r.slice()),
    b2: m.b2.slice(),
  };
}

const blockLoss = (m: MlpModel, b: Block) => {
  const { probs } = forwardPass(m, b.context);
  return -Math.log(Math.max(probs[b.target], 1e-12));
};

describe('MlpStrategy', () => {
  it('drives the cross-entropy loss down over training', () => {
    const blocks = trainingBlocks(CORPUS_8, vocab, 2);
    let model = initMlp(1, vocab.length, 3, 2, 8);
    const before = meanBlockLoss(model, blocks, mlpStrategy);

    let r = new StepTrainer(blocks, 0, model, mlpStrategy).doStep(0, 0.3);
    for (let i = 0; i < 300; i++) {
      r = new StepTrainer(blocks, r.step, r.after, mlpStrategy).doStep(blocks.length, 0.3);
    }
    model = r.after;
    const after = meanBlockLoss(model, blocks, mlpStrategy);

    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(1.0); // the small corpus is learnable to low loss
  });

  it('learns the d=3 / blockSize=3 / 22-token corpus used by the page', () => {
    const v = [...new Set(CORPUS_22.split(' '))];
    const blocks = trainingBlocks(CORPUS_22, v, 3);
    const model = initMlp(1, v.length, 3, 3, 8);
    const before = meanBlockLoss(model, blocks, mlpStrategy);
    let r = new StepTrainer(blocks, 0, model, mlpStrategy).doStep(0, 0.2);
    for (let i = 0; i < 400; i++) {
      r = new StepTrainer(blocks, r.step, r.after, mlpStrategy).doStep(blocks.length, 0.2);
    }
    expect(v.length).toBe(22);
    expect(meanBlockLoss(r.after, blocks, mlpStrategy)).toBeLessThan(before);
  });

  it('backprop matches the numerical gradient (central differences)', () => {
    const model = initMlp(7, vocab.length, 2, 2, 3);
    const block: Block = { context: [0, 1], target: 2 };
    const grads = backwardPass(model, block, forwardPass(model, block.context));

    const eps = 1e-5;
    const numeric = (read: (m: MlpModel) => number, write: (m: MlpModel, x: number) => void) => {
      const base = read(model);
      const plus = clone(model);
      write(plus, base + eps);
      const minus = clone(model);
      write(minus, base - eps);
      return (blockLoss(plus, block) - blockLoss(minus, block)) / (2 * eps);
    };

    // A representative entry from every parameter tensor.
    expect(numeric((m) => m.W2[1][2], (m, x) => (m.W2[1][2] = x))).toBeCloseTo(grads.dW2[1][2], 6);
    expect(numeric((m) => m.b2[2], (m, x) => (m.b2[2] = x))).toBeCloseTo(grads.db2[2], 6);
    expect(numeric((m) => m.W1[3][1], (m, x) => (m.W1[3][1] = x))).toBeCloseTo(grads.dW1[3][1], 6);
    expect(numeric((m) => m.b1[0], (m, x) => (m.b1[0] = x))).toBeCloseTo(grads.db1[0], 6);
    // Embedding row of a context token (id 1 sits in the second context slot).
    expect(numeric((m) => m.E[1][0], (m, x) => (m.E[1][0] = x))).toBeCloseTo(grads.dE[1][0], 6);
  });

  it('∇E accumulates correctly when a token repeats in the context', () => {
    // The single-entry gradient check above uses a non-repeating context; this
    // pins the `+=` accumulation branch of the embedding scatter (mlp.ts) — a
    // token in two slots must sum both slots' dx into its E row.
    const model = initMlp(7, vocab.length, 2, 3, 4);
    const block: Block = { context: [1, 4, 1], target: 2 }; // token 1 appears twice
    const grads = backwardPass(model, block, forwardPass(model, block.context));
    const eps = 1e-5;
    for (const j of [0, 1]) {
      const plus = clone(model);
      plus.E[1][j] += eps;
      const minus = clone(model);
      minus.E[1][j] -= eps;
      const numeric = (blockLoss(plus, block) - blockLoss(minus, block)) / (2 * eps);
      expect(numeric).toBeCloseTo(grads.dE[1][j], 6);
    }
  });

  it('after − before equals −lr·(flashed gradient) exactly, even for multi-step runs', () => {
    // The invariant every "after step" panel displays: doStep(n) applies n−1
    // updates, snapshots, then applies the last one — so the flashed gradient is
    // the one that produced the after−before delta, for any n (stepTrainer.ts).
    const blocks = trainingBlocks(CORPUS_8, vocab, 3);
    const model = initMlp(1, vocab.length, 1, 3, 8);
    const lr = 0.3;
    const r = new StepTrainer(blocks, 0, model, mlpStrategy).doStep(5, lr);
    const g = r.flash!.grads;
    r.after.W1.forEach((row, i) =>
      row.forEach((v, j) => expect(v - r.before.W1[i][j]).toBeCloseTo(-lr * g.dW1[i][j], 12)),
    );
    r.after.b2.forEach((v, k) => expect(v - r.before.b2[k]).toBeCloseTo(-lr * g.db2[k], 12));
    r.after.E.forEach((row, t) =>
      row.forEach((v, j) => expect(v - r.before.E[t][j]).toBeCloseTo(-lr * g.dE[t][j], 12)),
    );
  });

  it('flash snapshot exposes the worked example forward + gradients', () => {
    const blocks = trainingBlocks(CORPUS_8, vocab, 2);
    const model = initMlp(2, vocab.length, 3, 2, 8);
    const r = new StepTrainer(blocks, 0, model, mlpStrategy).doStep(1, 0.3);
    expect(r.flash).not.toBeNull();
    expect(r.flash!.forward.hidden).toHaveLength(8);
    expect(r.flash!.context).toHaveLength(2);
    // The output gradient is a valid (p − y): it sums to ~0.
    expect(r.flash!.grads.dLogits.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 8);
  });
});
