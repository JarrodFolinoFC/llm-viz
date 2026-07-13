// SGD update rules and corpus-level scoring for the free V×V logit table — the
// stepper and the convergence helper share one definition of the update.
import { crossEntropyGrad, softmaxRow } from './softmax.ts';

// One SGD step on a single logit row: softmax → grad → nudge. Shared by the live
// stepper (bigramTrainer.doStep) and trainToConvergence so the update rule has a
// single definition.
export function sgdRowUpdate(row: number[], target: number, lr: number) {
  const grad = crossEntropyGrad(softmaxRow(row), target);
  return row.map((v, i) => v - lr * grad[i]);
}

export function trainToConvergence(
  initialW: number[][],
  pairs: { prev: number; target: number }[],
  lr: number,
  epochs: number
) {
  const W = initialW.map((r) => r.slice());
  for (let e = 0; e < epochs; e++) {
    for (const pair of pairs) {
      W[pair.prev] = sgdRowUpdate(W[pair.prev], pair.target, lr);
    }
  }
  return W;
}

// Mean cross-entropy (average negative log-likelihood) of the whole corpus under
// the current weights. exp(meanCrossEntropy) is the perplexity. This generalizes
// to every later stage, unlike the bigram-only empirical-distribution error.
export function meanCrossEntropy(
  W: number[][],
  pairs: { prev: number; target: number }[]
) {
  if (pairs.length === 0) return 0;
  let sum = 0;
  for (const pair of pairs) {
    const probs = softmaxRow(W[pair.prev]);
    sum += -Math.log(Math.max(probs[pair.target], 1e-12));
  }
  return sum / pairs.length;
}
