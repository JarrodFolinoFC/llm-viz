// View-layer row packings shared by the table panels. These shape pure ML
// quantities into the `[a, b, c]` triples the Grid/ColumnGrid panels render —
// a presentation concern, kept out of the trainer and out of each container.

/** `[logit, eˣ, probability]` per next token — the RowSoftmax panel's rows. */
export function packSoftmaxRows(logits: number[], exps: number[], probs: number[]): number[][] {
  return logits.map((logit, i) => [logit, exps[i], probs[i]]);
}

/** `[p, y, p − y]` per next token — the GradientColumn panel's rows. */
export function packGradientRows(probs: number[], grad: number[], target: number): number[][] {
  return probs.map((p, i) => [p, i === target ? 1 : 0, grad[i]]);
}
