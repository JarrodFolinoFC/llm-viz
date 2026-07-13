import { argmax } from '../../core/math/funcs';
import type { LossMetric } from '../components/TrainingLoss';

/**
 * Examples whose greedy prediction misses the target (argmax(probs) ≠ target),
 * scored through the caller's `probsOf` so it serves any model — a block model's
 * `forwardPass(...).probs`, a bigram's row softmax, whatever. Generic over the
 * example so it covers both `Block`s and `Pair`s (both carry a `target`).
 */
export function misclassifiedCount<T extends { target: number }>(
  examples: readonly T[],
  probsOf: (example: T) => number[],
): number {
  return examples.reduce((n, ex) => n + (argmax(probsOf(ex)) === ex.target ? 0 : 1), 0);
}

/**
 * The shared "misclassified" headline metric for the block models (MLP, RNN):
 * the wrong-prediction count with the corpus's irreducible floor spelled out —
 * an ambiguous corpus makes some misses unavoidable, so the floor (not 0) is a
 * perfect score. One definition, since every block stage words it identically.
 */
export function misclassifiedMetric(wrong: number, total: number, minMisclassified: number): LossMetric {
  return {
    label: 'misclassified',
    value: `${wrong} / ${total}`,
    explain:
      `Training blocks the model predicts wrong (argmax of the output ≠ the actual next token), out of all blocks. The corpus is ambiguous — the same context precedes different targets — so ${minMisclassified} of these are unavoidable: ${minMisclassified} / ${total} is a perfect score, not 0.`,
  };
}
