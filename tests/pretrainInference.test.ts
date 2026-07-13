import { describe, it, expect } from 'vitest';

import { randomMatrix, trainingPairs, dot, softmaxRow, argmax } from 'mlblocks/core';
import { embeddingStrategy, EmbeddingStrategy } from '../src/training/strategies/embedding';
import { mlpStrategy, initMlp, forwardPass } from '../src/training/strategies/mlp';
import { trainingBlocks } from 'mlblocks/core';
import { pretrain } from 'mlblocks/core';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_16, CORPUS_8, CORPUS_22 } from '../src/lib/corpora';

// The inference pages start from a model trained to convergence by `pretrain`.
// These guard that the chosen epochs/lr actually learn the corpus, so the pages
// show sensible predictions rather than noise.
describe('pretrain convergence (inference models)', () => {
  it('embedding bigram learns the corpus', () => {
    const vocab = vocabOf(CORPUS_16);
    const V = vocab.length;
    const pairs = trainingPairs(CORPUS_16, vocab);
    const init = { E: randomMatrix(42, V, 2, 1), U: randomMatrix(43, V, 2, 1) };
    const before = embeddingStrategy.loss(init, pairs);
    const model = pretrain(embeddingStrategy, init, pairs, 0.5, 1000);
    expect(embeddingStrategy.loss(model, pairs)).toBeLessThan(before);

    const logits = EmbeddingStrategy.logits(model.E, model.U);
    const correct = pairs.filter((p) => argmax(logits[p.prev]) === p.target).length;
    expect(correct / pairs.length).toBeGreaterThan(0.5);

    // A generation step returns a valid vocab id.
    const next = argmax(softmaxRow(model.U.map((u) => dot(model.E[0], u))));
    expect(next).toBeGreaterThanOrEqual(0);
    expect(next).toBeLessThan(V);
  });

  // 2000-epoch pretrains: give them room when the full suite loads the machine.
  it.each([
    ['MLP vector', CORPUS_22, 3],
    ['MLP scalar', CORPUS_8, 1],
  ] as const)('%s learns the corpus', { timeout: 30_000 }, (_name, corpus, dim) => {
    const vocab = vocabOf(corpus);
    const blocks = trainingBlocks(corpus, vocab, 3);
    const init = initMlp(42, vocab.length, dim, 3, 8);
    const before = mlpStrategy.loss(init, blocks);
    const model = pretrain(mlpStrategy, init, blocks, 0.3, 2000);
    expect(mlpStrategy.loss(model, blocks)).toBeLessThan(before);

    const correct = blocks.filter((b) => argmax(forwardPass(model, b.context).probs) === b.target).length;
    expect(correct / blocks.length).toBeGreaterThan(0.5);
  });
});
