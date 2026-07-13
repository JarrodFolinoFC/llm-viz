import { describe, it, expect } from 'vitest';

import {
  randomMatrix,
  seededShuffle,
  softmaxRow,
  softmaxRowParts,
  crossEntropyGrad,
  dot,
  trainingPairs,
  trainToConvergence,
} from 'mlblocks/core';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8, CORPUS_16, CORPUS_22 } from '../src/lib/corpora';
import { corpusStats, analysis } from 'mlblocks/core';
import { StepTrainer } from 'mlblocks/core';
import { trainingBlocks } from 'mlblocks/core';
import { bigramStrategy } from '../src/training/strategies/bigram';
import { embeddingStrategy, tiedEmbeddingStrategy } from '../src/training/strategies/embedding';
import { mlpStrategy, initMlp } from '../src/training/strategies/mlp';
import { rnnStrategy, initRnn } from '../src/training/strategies/rnn';

/**
 * Cross-panel linkage tests: every number a panel displays must be derivable
 * from the other numbers on screen. Each block reproduces one page's exact
 * container wiring (same corpus, vocab construction, seed and lr0) and asserts
 * the invariants the panels visually claim — softmax columns, p − y, the
 * −η·grad update against the after-step deltas, and the worked-example replay.
 * The per-tensor gradients themselves are checked against finite differences
 * in mlpTrainer.test.ts / rnnTrainer.test.ts; this file checks the *view*
 * quantities agree with each other.
 */

const expectVecClose = (a: number[], b: number[], digits = 9) => {
  expect(a.length).toBe(b.length);
  a.forEach((x, i) => expect(x).toBeCloseTo(b[i], digits));
};
const expectMatClose = (A: number[][], B: number[][], digits = 9) => {
  expect(A.length).toBe(B.length);
  A.forEach((r, i) => expectVecClose(r, B[i], digits));
};

// ── Bigram (Scalar) — BigramPage wiring: CORPUS_8, seed 1, lr 0.5 ──
describe('bigram flow: panels link', () => {
  const vocab = [...new Set(CORPUS_8.split(' '))];
  const { pairs } = corpusStats(CORPUS_8, vocab);
  const lr = 0.5;
  const init = () => randomMatrix(1, vocab.length, vocab.length, 1);

  const stepOnce = () => {
    const r0 = new StepTrainer(pairs, 0, init(), bigramStrategy).doStep(0, lr);
    // Deep-copied so the untouched-rows assertion compares real before values,
    // not shared references (and stays honest if applyUpdates ever mutates).
    const before = bigramStrategy.modelOf(r0).map((row) => row.slice());
    const r = new StepTrainer(pairs, r0.step, bigramStrategy.modelOf(r0), bigramStrategy).doStep(1, lr);
    return { before, r };
  };

  it('W(after) − W(before) on the trained row == the update panel’s −η·(p − y)', () => {
    const { r } = stepOnce();
    const f = r.flash!;
    const deltas = r.W[f.prev].map((v, j) => v - f.prevRow[j]);
    expectVecClose(deltas, r.prevGrad.map((g) => -lr * g));
  });

  it('leaves every untouched row identical to the before-step matrix', () => {
    const { before, r } = stepOnce();
    const f = r.flash!;
    r.W.forEach((row, i) => {
      if (i !== f.prev) expectVecClose(row, before[i]);
    });
  });

  it('worked-example softmax row replays softmax(W-before[prev]), and p == eˣ/Σeˣ', () => {
    const { r } = stepOnce();
    expectVecClose(r.prevProbs, softmaxRow(r.flash!.prevRow));
    expectVecClose(r.prevProbs, r.prevExps.map((e) => e / r.prevExpSum));
    expect(r.prevProbs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it('gradient column == probs − onehot(target)', () => {
    const { r } = stepOnce();
    expectVecClose(r.prevGrad, crossEntropyGrad(r.prevProbs, r.flash!.target));
  });

  it('"this step" loss == −log p(target) under the post-update weights', () => {
    const { r } = stepOnce();
    const probs = softmaxRow(r.W[r.currentPair.prev]);
    expect(r.currentLoss).toBeCloseTo(-Math.log(probs[r.currentPair.target]), 9);
  });

  it('training drives the dist. error metric toward its promised 0', () => {
    const { empirical } = corpusStats(CORPUS_8, vocab);
    const W0 = init();
    const before = analysis(W0, empirical).totalError;
    const after = analysis(trainToConvergence(W0, pairs, lr, 100), empirical).totalError;
    expect(after).toBeLessThan(before * 0.2);
    expect(after).toBeLessThan(0.05);
  });
});

// ── Bigram (Vector) — VectorPage wiring: CORPUS_16, dim 2, seed 1, lr 0.5 ──
describe('vector flow: panels link', () => {
  const vocab = vocabOf(CORPUS_16);
  const { pairs } = corpusStats(CORPUS_16, vocab);
  const dim = 2;
  const lr = 0.5;
  const init = () => ({
    E: randomMatrix(1, vocab.length, dim, 1),
    U: randomMatrix(2, vocab.length, dim, 1),
  });

  const stepOnce = () => {
    const r0 = new StepTrainer(pairs, 0, init(), embeddingStrategy).doStep(0, lr);
    return new StepTrainer(pairs, r0.step, embeddingStrategy.modelOf(r0), embeddingStrategy).doStep(1, lr);
  };

  it('EmbeddingUpdate’s e′ column: E[a] after == e_a − η·∂L/∂e_a', () => {
    const r = stepOnce();
    const f = r.flash!;
    expectVecClose(r.E[f.prev], f.prevE.map((v, i) => v - lr * f.gradE[i]));
  });

  it('every u_b after == u_b − η·(p_b − y_b)·e_a, using the PRE-update e_a', () => {
    const r = stepOnce();
    const f = r.flash!;
    r.U.forEach((u, b) => {
      expectVecClose(u, r.UBefore[b].map((v, i) => v - lr * f.prevGrad[b] * f.prevE[i]));
    });
  });

  it('DotProduct panel logits recompute from EBefore/UBefore', () => {
    const r = stepOnce();
    const f = r.flash!;
    const recomputed = r.UBefore.map((u) => dot(r.EBefore[f.prev], u));
    expectVecClose(recomputed, f.prevLogits);
  });

  it('gradE == Σ_b (p_b − y_b)·u_b, recomputed independently', () => {
    const r = stepOnce();
    const f = r.flash!;
    const gradE = Array.from({ length: dim }, (_, i) =>
      r.UBefore.reduce((s, u, b) => s + f.prevGrad[b] * u[i], 0),
    );
    expectVecClose(f.gradE, gradE);
  });

  it('tied variant: U stays E, and the shared table takes both roles’ gradients', () => {
    const E0 = randomMatrix(1, vocab.length, dim, 1);
    const r0 = new StepTrainer(pairs, 0, { E: E0, U: E0 }, tiedEmbeddingStrategy).doStep(0, lr);
    const r = new StepTrainer(pairs, r0.step, tiedEmbeddingStrategy.modelOf(r0), tiedEmbeddingStrategy).doStep(1, lr);
    const f = r.flash!;
    expect(r.E).toBe(r.U); // one table, both roles
    // Accumulated gradient of the single table: every row's u-side nudge, plus
    // the e-side pull on row a — all computed on the pre-update table.
    r.E.forEach((row, b) => {
      const expected = r.EBefore[b].map(
        (v, i) => v - lr * (f.prevGrad[b] * f.prevE[i] + (b === f.prev ? f.gradE[i] : 0)),
      );
      expectVecClose(row, expected);
    });
  });
});

// ── MLP for NLP — MlpPage wiring: CORPUS_22, d 3, N 3, H 8, seed 1, lr 0.3 ──
describe('mlp flow: panels link', () => {
  const vocab = [...new Set(CORPUS_22.split(' '))];
  const blocks = trainingBlocks(CORPUS_22, vocab, 3);
  const lr = 0.3;
  const init = () => initMlp(1, vocab.length, 3, 3, 8);

  const stepOnce = () => {
    const r0 = new StepTrainer(blocks, 0, init(), mlpStrategy).doStep(0, lr);
    return new StepTrainer(blocks, r0.step, mlpStrategy.modelOf(r0), mlpStrategy).doStep(1, lr);
  };

  it('x is the concatenated context embedding rows of the E panel', () => {
    const r = stepOnce();
    const f = r.flash!;
    expectVecClose(f.forward.x, f.context.flatMap((c) => r.before.E[c]));
  });

  it('HiddenLayer columns: z₁ == x·W₁ + b₁ and h == tanh(z₁)', () => {
    const r = stepOnce();
    const f = r.flash!;
    const z = r.before.b1.map((b, j) =>
      f.forward.x.reduce((s, xv, k) => s + xv * r.before.W1[k][j], b),
    );
    expectVecClose(f.forward.z1, z);
    expectVecClose(f.forward.hidden, f.forward.z1.map(Math.tanh));
  });

  it('RowSoftmax logits == h·W₂ + b₂ (b₂ is part of the displayed number)', () => {
    const r = stepOnce();
    const f = r.flash!;
    const logits = r.before.b2.map((b, j) =>
      f.forward.hidden.reduce((s, h, k) => s + h * r.before.W2[k][j], b),
    );
    expectVecClose(f.forward.logits, logits);
  });

  it('after-step Δ annotations == −η·∇ for every parameter, biases included', () => {
    const r = stepOnce();
    const g = r.flash!.grads;
    expectMatClose(
      r.after.W1.map((row, i) => row.map((v, j) => v - r.before.W1[i][j])),
      g.dW1.map((row) => row.map((x) => -lr * x)),
    );
    expectMatClose(
      r.after.W2.map((row, i) => row.map((v, j) => v - r.before.W2[i][j])),
      g.dW2.map((row) => row.map((x) => -lr * x)),
    );
    expectMatClose(
      r.after.E.map((row, i) => row.map((v, j) => v - r.before.E[i][j])),
      g.dE.map((row) => row.map((x) => -lr * x)),
    );
    expectVecClose(r.after.b1.map((v, i) => v - r.before.b1[i]), g.db1.map((x) => -lr * x));
    expectVecClose(r.after.b2.map((v, i) => v - r.before.b2[i]), g.db2.map((x) => -lr * x));
  });

  it('a +10 run flashes its FINAL step: Δ(after − before) == −η·∇(flash)', () => {
    // Multi-step runs snapshot the last update, so the update panels stay a
    // true worked example — never an accumulated span next to a 1-step grad.
    const r0 = new StepTrainer(blocks, 0, init(), mlpStrategy).doStep(0, lr);
    const r = new StepTrainer(blocks, r0.step, mlpStrategy.modelOf(r0), mlpStrategy).doStep(10, lr);
    expect(r.flash).not.toBeNull();
    expect(r.flash!.pairIdx).toBe(r.pairIdx); // the flash IS the current example
    const g = r.flash!.grads;
    expectMatClose(
      r.after.W1.map((row, i) => row.map((v, j) => v - r.before.W1[i][j])),
      g.dW1.map((row) => row.map((x) => -lr * x)),
    );
    expectVecClose(r.after.b2.map((v, i) => v - r.before.b2[i]), g.db2.map((x) => -lr * x));
  });

  it('a +10 run’s total Δ == the sum of the 10 per-step flash −η·∇ (telescoped SGD)', () => {
    // The multi-step update panel is only honest if the whole-run delta is the
    // sum of the single-step updates the flash panels would have shown.
    let r = new StepTrainer(blocks, 0, init(), mlpStrategy).doStep(0, lr);
    const start = r.after;
    const total = start.W1.map((row) => row.map(() => 0));
    for (let k = 0; k < 10; k++) {
      r = new StepTrainer(blocks, r.step, mlpStrategy.modelOf(r), mlpStrategy).doStep(1, lr);
      r.flash!.grads.dW1.forEach((row, i) => row.forEach((x, j) => (total[i][j] += -lr * x)));
    }
    expectMatClose(
      r.after.W1.map((row, i) => row.map((v, j) => v - start.W1[i][j])),
      total,
      8,
    );
  });
});

// ── RNN (vector) — RnnPage wiring: CORPUS_22, d 3, N 3, H 6, seed 1, lr 0.3 ──
describe('rnn flow: panels link', () => {
  const vocab = [...new Set(CORPUS_22.split(' '))];
  const blocks = trainingBlocks(CORPUS_22, vocab, 3);
  const lr = 0.3;
  const init = () => initRnn(1, vocab.length, 3, 6);

  const stepOnce = () => {
    const r0 = new StepTrainer(blocks, 0, init(), rnnStrategy).doStep(0, lr);
    return new StepTrainer(blocks, r0.step, rnnStrategy.modelOf(r0), rnnStrategy).doStep(1, lr);
  };

  it('H panel rows replay the recurrence: hₜ == tanh(E[cₜ]·W_xh + hₜ₋₁·W_hh + b_h)', () => {
    const r = stepOnce();
    const f = r.flash!;
    const H = r.before.bh.length;
    let h = new Array(H).fill(0);
    f.context.forEach((c, t) => {
      const x = r.before.E[c];
      const z = r.before.bh.map((b, j) => {
        const inp = x.reduce((s, xv, k) => s + xv * r.before.Wxh[k][j], 0);
        const rec = h.reduce((s, hv, k) => s + hv * r.before.Whh[k][j], 0);
        return b + inp + rec;
      });
      const hNext = z.map(Math.tanh);
      expectVecClose(f.forward.hiddens[t], hNext);
      h = hNext;
    });
    expectVecClose(f.forward.hN, f.forward.hiddens[f.context.length - 1]);
  });

  it('RowSoftmax logits == h_N·W_hy + b_y (b_y is part of the displayed number)', () => {
    const r = stepOnce();
    const f = r.flash!;
    const logits = r.before.by.map((b, j) =>
      f.forward.hN.reduce((s, h, k) => s + h * r.before.Why[k][j], b),
    );
    expectVecClose(f.forward.logits, logits);
  });

  it('after-step Δ annotations == −η·∇ for every parameter, biases included', () => {
    const r = stepOnce();
    const g = r.flash!.grads;
    expectMatClose(
      r.after.Wxh.map((row, i) => row.map((v, j) => v - r.before.Wxh[i][j])),
      g.dWxh.map((row) => row.map((x) => -lr * x)),
    );
    expectMatClose(
      r.after.Whh.map((row, i) => row.map((v, j) => v - r.before.Whh[i][j])),
      g.dWhh.map((row) => row.map((x) => -lr * x)),
    );
    expectMatClose(
      r.after.Why.map((row, i) => row.map((v, j) => v - r.before.Why[i][j])),
      g.dWhy.map((row) => row.map((x) => -lr * x)),
    );
    expectMatClose(
      r.after.E.map((row, i) => row.map((v, j) => v - r.before.E[i][j])),
      g.dE.map((row) => row.map((x) => -lr * x)),
    );
    expectVecClose(r.after.bh.map((v, i) => v - r.before.bh[i]), g.dbh.map((x) => -lr * x));
    expectVecClose(r.after.by.map((v, i) => v - r.before.by[i]), g.dby.map((x) => -lr * x));
  });
});

// ── Shared step bookkeeping — the corpus panel, epoch counter and flash agree ──
describe('step bookkeeping links panels to the corpus', () => {
  const vocab = [...new Set(CORPUS_8.split(' '))];
  const pairs = trainingPairs(CORPUS_8, vocab);

  it('flash pair is examples[pairIdx], and pairIdx tracks (step − 1) % examples', () => {
    let r = new StepTrainer(pairs, 0, randomMatrix(1, vocab.length, vocab.length, 1), bigramStrategy).doStep(0, 0.5);
    for (let s = 1; s <= pairs.length + 2; s++) {
      r = new StepTrainer(pairs, r.step, bigramStrategy.modelOf(r), bigramStrategy).doStep(1, 0.5);
      expect(r.step).toBe(s);
      expect(r.pairIdx).toBe((s - 1) % pairs.length);
      expect(r.flash!.pairIdx).toBe(r.pairIdx);
      expect(r.currentPair).toEqual(pairs[r.pairIdx]);
    }
  });

  it('flash.pos names the corpus tokens even when the training order is shuffled', () => {
    // The corpus-highlight panels read flash.pos (the example's own corpus
    // position), so the shuffle toggle can't desynchronise them.
    const shuffled = seededShuffle(pairs, 7);
    const tokens = CORPUS_8.split(/\s+/).filter(Boolean);
    let r = new StepTrainer(shuffled, 0, randomMatrix(1, vocab.length, vocab.length, 1), bigramStrategy).doStep(0, 0.5);
    for (let s = 0; s < 5; s++) {
      r = new StepTrainer(shuffled, r.step, bigramStrategy.modelOf(r), bigramStrategy).doStep(1, 0.5);
      const f = r.flash!;
      expect(tokens[f.pos!]).toBe(vocab[f.prev]);
      expect(tokens[f.pos! + 1]).toBe(vocab[f.target]);
    }
  });

  it('bigram pair index == corpus token position (what TrainingCorpus highlights)', () => {
    const tokens = CORPUS_8.split(/\s+/).filter(Boolean);
    pairs.forEach((p, k) => {
      expect(vocab[p.prev]).toBe(tokens[k]);
      expect(vocab[p.target]).toBe(tokens[k + 1]);
    });
  });

  it('block k targets corpus position k + blockSize (what targetPos assumes)', () => {
    const v22 = [...new Set(CORPUS_22.split(' '))];
    const tokens = CORPUS_22.split(/\s+/).filter(Boolean);
    const blocks = trainingBlocks(CORPUS_22, v22, 3);
    blocks.forEach((b, k) => {
      expect(v22[b.target]).toBe(tokens[k + 3]);
      expect(b.context.map((c) => v22[c])).toEqual(tokens.slice(k, k + 3));
    });
  });
});

// ── Vocab hygiene — the page-side `vocabOf` vocab construction ──
describe('page vocab construction', () => {
  it('every corpus vocab contains no phantom tokens and matches its name', () => {
    expect(vocabOf(CORPUS_8)).toHaveLength(8);
    expect(vocabOf(CORPUS_16)).toHaveLength(16);
    expect(vocabOf(CORPUS_22)).toHaveLength(22);
    expect(vocabOf(CORPUS_8)).not.toContain('');
    expect(vocabOf(CORPUS_16)).not.toContain('');
    expect(vocabOf(CORPUS_22)).not.toContain('');
  });
});

// ── Loss panel — the three headline numbers derive from each other ──
describe('loss panel derivations', () => {
  it('mean cross-entropy == mean of −log p(target); perplexity == exp of it', () => {
    const vocab = [...new Set(CORPUS_8.split(' '))];
    const pairs = trainingPairs(CORPUS_8, vocab);
    const W = randomMatrix(3, vocab.length, vocab.length, 1);
    const mean = bigramStrategy.loss(W, pairs);
    const byHand =
      pairs.reduce((s, p) => s - Math.log(softmaxRowParts(W[p.prev]).probs[p.target]), 0) / pairs.length;
    expect(mean).toBeCloseTo(byHand, 9);
    expect(Math.exp(mean)).toBeGreaterThan(1); // perplexity floor
    expect(Math.exp(mean)).toBeLessThanOrEqual(vocab.length * 1.5); // sane for random init
  });
});
