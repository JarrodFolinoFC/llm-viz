import { describe, it, expect } from 'vitest';

import { StepTrainer, trainingBlocks, vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from '../src/lib/corpora';
import { lblStrategy, initLbl, forwardPass } from '../src/training/strategies/lbl';

const vocab = vocabOf(CORPUS_8);
const blocks = trainingBlocks(CORPUS_8, vocab, 3);

const stepTo = (n: number, lr = 0.3) =>
  new StepTrainer(blocks, 0, initLbl(1, vocab.length, 1, 3), lblStrategy).doStep(n, lr);

describe('log-bilinear strategy', () => {
  it('forward is the hidden-less MLP: logits = concat(E[context])·W + b', () => {
    const model = initLbl(1, vocab.length, 1, 3);
    const { context } = blocks[0];
    const { x, logits } = forwardPass(model, context);
    expect(x).toEqual(context.map((c) => model.E[c][0]));
    logits.forEach((l, v) => {
      const manual = x.reduce((s, xi, i) => s + xi * model.W[i][v], model.b[v]);
      expect(l).toBeCloseTo(manual, 12);
    });
  });

  it('after − before equals −η·(x ⊗ (p−y)) for W and −η·(p−y) for b', () => {
    const lr = 0.3;
    const result = stepTo(1, lr);
    const { flash, after, before } = result;
    const { x, probs } = flash!.forward;
    const grad = probs.map((p, v) => p - (v === flash!.target ? 1 : 0));
    after.W.forEach((row, i) =>
      row.forEach((w, v) => expect(w - before.W[i][v]).toBeCloseTo(-lr * x[i] * grad[v], 10)));
    after.b.forEach((b, v) => expect(b - before.b[v]).toBeCloseTo(-lr * grad[v], 10));
  });

  it('scatters dx = W·(p−y) into exactly the context rows of E', () => {
    const result = stepTo(1);
    const { flash, after, before } = result;
    const touched = new Set(flash!.context);
    before.E.forEach((row, tok) => {
      if (!touched.has(tok)) expect(after.E[tok]).toEqual(row);
      else expect(after.E[tok]).not.toEqual(row);
    });
  });

  it('training reduces the mean cross-entropy', () => {
    const loss0 = lblStrategy.loss(initLbl(1, vocab.length, 1, 3), blocks);
    const lossN = lblStrategy.loss(stepTo(blocks.length * 4).after, blocks);
    expect(lossN).toBeLessThan(loss0);
  });
});
