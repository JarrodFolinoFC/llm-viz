// Softmax and its cross-entropy gradient — the forward/backward primitives every
// stage shares for turning logits into next-token probabilities.

// Gradient of softmax + cross-entropy w.r.t. the logits: probs − one_hot(target).
// The full chain rule collapses to this clean form, which is why training code
// never differentiates the loss explicitly.
export function crossEntropyGrad(probs: number[], target: number) {
  return probs.map((p, i) => (i === target ? p - 1 : p));
}

// Mask-aware: non-finite entries (e.g. -Infinity from causal masking) contribute
// zero probability. Identical to a plain softmax for all-finite rows. Derived
// from softmaxRowParts so the probabilities can never drift from the eˣ/Σ the
// worked-example panels display.
export function softmaxRow(row: number[]) {
  return softmaxRowParts(row).probs;
}

export interface RowForward {
  exps: number[];
  expSum: number;
  probs: number[];
}

// Forward pass for one logit row: the stable softmax plus the intermediate eˣ
// values it's built from (shifted by the row max so the displayed eˣ column stays
// finite; the softmax itself is unchanged). Single definition shared by both
// trainers' worked-example panels.
export function softmaxRowParts(logits: number[]): RowForward {
  const finite = logits.filter((v) => Number.isFinite(v));
  const max = finite.length ? Math.max(...finite) : 0;
  const exps = logits.map((v) => (Number.isFinite(v) ? Math.exp(v - max) : 0));
  const expSum = exps.reduce((a, b) => a + b, 0);
  // Derive probs from the exps we already have (single stable-softmax pass).
  return { exps, expSum, probs: exps.map((e) => (expSum > 0 ? e / expSum : 0)) };
}
