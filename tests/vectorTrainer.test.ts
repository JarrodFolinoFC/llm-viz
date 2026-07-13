import { describe, it, expect } from 'vitest';
import { EmbeddingStrategy, embeddingStrategy } from '../src/training/strategies/embedding';
import { StepTrainer } from 'mlblocks/core';
import { randomMatrix, meanCrossEntropy, trainingPairs, softmaxRow } from 'mlblocks/core';
import { CORPUS_8, CORPUS_22 } from '../src/lib/corpora';

const vocab = [...new Set(CORPUS_8.split(' '))];
const pairs = trainingPairs(CORPUS_8, vocab);
const loss = (E: number[][], U: number[][]) =>
  meanCrossEntropy(EmbeddingStrategy.logits(E, U), pairs);

describe('EmbeddingStrategy', () => {
  it('drives the cross-entropy loss down over an epoch', () => {
    const E0 = randomMatrix(1, vocab.length, 4, 1);
    const U0 = randomMatrix(2, vocab.length, 4, 1);
    const before = loss(E0, U0);

    let r = new StepTrainer(pairs, 0, { E: E0, U: U0 }, embeddingStrategy).doStep(0, 0.5);
    for (let i = 0; i < 200; i++) {
      r = new StepTrainer(pairs, r.step, { E: r.E, U: r.U }, embeddingStrategy).doStep(pairs.length, 0.5);
    }
    const after = loss(r.E, r.U);

    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(1.0); // bigram structure is learnable to low loss
  });

  it('still reduces loss at the d=2 bottleneck used by the page', () => {
    const E0 = randomMatrix(1, vocab.length, 2, 1);
    const U0 = randomMatrix(2, vocab.length, 2, 1);
    const before = loss(E0, U0);
    let r = new StepTrainer(pairs, 0, { E: E0, U: U0 }, embeddingStrategy).doStep(0, 0.5);
    for (let i = 0; i < 300; i++) {
      r = new StepTrainer(pairs, r.step, { E: r.E, U: r.U }, embeddingStrategy).doStep(pairs.length, 0.5);
    }
    const after = loss(r.E, r.U);
    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(1.0);
  });

  it('learns the d=3 / 22-token corpus used by the page', () => {
    const v = [...new Set(CORPUS_22.split(' '))];
    const p = trainingPairs(CORPUS_22, v);
    const l = (E: number[][], U: number[][]) => meanCrossEntropy(EmbeddingStrategy.logits(E, U), p);
    const E0 = randomMatrix(1, v.length, 3, 1);
    const U0 = randomMatrix(2, v.length, 3, 1);
    const before = l(E0, U0);
    let r = new StepTrainer(p, 0, { E: E0, U: U0 }, embeddingStrategy).doStep(0, 0.3);
    for (let i = 0; i < 400; i++) {
      r = new StepTrainer(p, r.step, { E: r.E, U: r.U }, embeddingStrategy).doStep(p.length, 0.3);
    }
    expect(v.length).toBe(22);
    expect(l(r.E, r.U)).toBeLessThan(before);
  });

  it('matches logit[a][b] = e_a · u_b', () => {
    const E = randomMatrix(3, vocab.length, 4, 1);
    const U = randomMatrix(4, vocab.length, 4, 1);
    const logits = EmbeddingStrategy.logits(E, U);
    const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
    expect(logits[2][5]).toBeCloseTo(dot(E[2], U[5]), 10);
    // softmax of a row is a valid distribution
    const probs = softmaxRow(logits[0]);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('flash snapshot exposes the pre-step e_a and its gradient', () => {
    const E = randomMatrix(5, vocab.length, 4, 1);
    const U = randomMatrix(6, vocab.length, 4, 1);
    const r = new StepTrainer(pairs, 0, { E, U }, embeddingStrategy).doStep(1, 0.5);
    expect(r.flash).not.toBeNull();
    expect(r.flash!.prevE).toHaveLength(4);
    expect(r.flash!.gradE).toHaveLength(4);
    // e_a actually moved by −lr · gradE
    const a = r.flash!.prev;
    for (let i = 0; i < 4; i++) {
      expect(r.E[a][i]).toBeCloseTo(r.flash!.prevE[i] - 0.5 * r.flash!.gradE[i], 10);
    }
  });
});
