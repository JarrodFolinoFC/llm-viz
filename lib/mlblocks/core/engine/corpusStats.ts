import { bigramCounts, trainingPairs, softmaxRow, tokenize } from '../math/funcs';
import type { Matrix } from '../types';
import type { Pair } from './stepTrainer';

// Stateless corpus/weight analysis. These neither step nor need a live trainer,
// so they stay plain functions — both flows call them directly rather than
// constructing a StepTrainer just to borrow a method.

export interface CorpusStats {
  counts: Matrix;
  pairs: Pair[];
  empirical: Matrix;
}

export interface Analysis {
  softmaxW: Matrix;
  errorMatrix: Matrix;
  rowErrors: number[];
  /** Mean total-variation distance between learned and empirical rows, in [0, 1]. */
  totalError: number;
}

/** Bigram counts, training pairs, and the empirical next-token distribution. */
export function corpusStats(corpus: string, vocab: readonly string[]): CorpusStats {
  const { counts } = bigramCounts(corpus, vocab);
  const pairs = trainingPairs(corpus, vocab);
  const empirical = counts.map((row) => {
    const sum = row.reduce((a, b) => a + b, 0);
    return sum === 0 ? row.map(() => 0) : row.map((c) => c / sum);
  });
  return { counts, pairs, empirical };
}

/** The corpus's irreducible limits for a ctxLen-token context model. */
export interface LossFloors {
  /** Conditional entropy H(next | context) — no model can score below this. */
  minCrossEntropy: number;
  /** Examples whose target isn't their context's modal next token — argmax can never get these. */
  minMisclassified: number;
  /** Total (context → next) examples the floors are over. */
  examples: number;
}

/**
 * How well a perfect ctxLen-context model could possibly do on this corpus.
 * The same context precedes different targets (the corpora are ambiguous), so
 * cross-entropy bottoms out at the conditional entropy — not 0 — and argmax
 * accuracy at the modal-target count. The loss panel plots/reports these so a
 * plateau reads as "converged", not "broken".
 */
export function lossFloors(corpus: string, ctxLen: number): LossFloors {
  const tokens = tokenize(corpus);
  const byContext = new Map<string, Map<string, number>>();
  for (let i = ctxLen; i < tokens.length; i++) {
    const key = tokens.slice(i - ctxLen, i).join(' ');
    const counts = byContext.get(key) ?? new Map<string, number>();
    counts.set(tokens[i], (counts.get(tokens[i]) ?? 0) + 1);
    byContext.set(key, counts);
  }
  let examples = 0;
  let entropy = 0;
  let minMisclassified = 0;
  for (const counts of byContext.values()) {
    const values = [...counts.values()];
    const total = values.reduce((a, b) => a + b, 0);
    examples += total;
    minMisclassified += total - Math.max(...values);
    for (const c of values) entropy += -c * Math.log(c / total);
  }
  return { minCrossEntropy: examples ? entropy / examples : 0, minMisclassified, examples };
}

/** How far the softmax of W sits from the empirical bigram distribution. */
export function analysis(W: Matrix, empirical: Matrix): Analysis {
  const softmaxW = W.map(softmaxRow);
  const errorMatrix = softmaxW.map((row, i) => row.map((p, j) => p - empirical[i][j]));
  const rowErrors = errorMatrix.map((row) => row.reduce((a, b) => a + Math.abs(b), 0) / 2);
  const totalError = rowErrors.reduce((a, b) => a + b, 0) / rowErrors.length;
  return { softmaxW, errorMatrix, rowErrors, totalError };
}
