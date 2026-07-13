import {
  tanhVec,
  dtanhFromOutput,
  matVecRight,
  matVecLeft,
  outer,
  softmaxRow,
  crossEntropyGrad,
  randomMatrix,
  zeros,
  stepMatrix,
  stepVec,
} from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import type { Block } from 'mlblocks/core';
import { BlockStrategy, type BlockFlash, type BlockStepResult } from 'mlblocks/core';

/**
 * Stage — the Elman recurrent network (RNN). Where the MLP concatenates the N
 * context embeddings into one fixed-width vector, the RNN reads them *one at a
 * time*, folding each into a running hidden state:
 *
 *     x_t = E[c_t]                                  (embedding of the t-th token)
 *     h_t = tanh(x_t · W_xh + h_{t-1} · W_hh + b_h) (recurrence; h_0 = 0)
 *     logits = h_N · W_hy + b_y                      (read out the last state)
 *
 * The new idea over the MLP is **W_hh**, the recurrence: the same weights mix the
 * previous hidden state into the next one at every step, so the model has a
 * memory of arbitrary length with a fixed parameter count. Backprop is therefore
 * *through time* (BPTT): the output gradient flows back into h_N, then hops
 * step-by-step down the chain (h_N → h_{N-1} → …), accumulating ∇W_xh, ∇W_hh and
 * scattering ∇E into each step's context token.
 */

/** Elman-RNN parameters: a token embedding, the recurrent cell, and a read-out. */
export interface RnnModel {
  /** V × d — one learned embedding per token. */
  E: Matrix;
  /** d × H — input-to-hidden weights. */
  Wxh: Matrix;
  /** H × H — hidden-to-hidden (recurrent) weights. */
  Whh: Matrix;
  /** H — hidden bias. */
  bh: number[];
  /** H × V — hidden-to-output (read-out) weights. */
  Why: Matrix;
  /** V — output bias. */
  by: number[];
}

/** Forward-pass intermediates for one context block — what the panels render. */
export interface RnnForward {
  /** N × d — the embedding read at each step (x_t = E[c_t]). */
  xs: Matrix;
  /** N × H — the pre-activation z_t at each step (before tanh). */
  zs: Matrix;
  /** N × H — the previous hidden state h_{t-1} fed into each step (h_0 = 0). */
  hPrev: Matrix;
  /** N × H — the hidden state h_t after each step. */
  hiddens: Matrix;
  /** H — the final hidden state h_N (feeds the read-out). */
  hN: number[];
  /** V output logits (h_N · W_hy + b_y). */
  logits: number[];
  /** V softmax(logits). */
  probs: number[];
}

/** Backward-pass gradients for one example — what the backprop panels render. */
export interface RnnGrads {
  /** V — ∂L/∂logits = p − y. */
  dLogits: number[];
  /** H × V — ∂L/∂W_hy = h_N ⊗ dLogits. */
  dWhy: Matrix;
  /** V — ∂L/∂b_y. */
  dby: number[];
  /** d × H — ∂L/∂W_xh, summed over time. */
  dWxh: Matrix;
  /** H × H — ∂L/∂W_hh, summed over time. */
  dWhh: Matrix;
  /** H — ∂L/∂b_h, summed over time. */
  dbh: number[];
  /** V × d — ∂L/∂E, the per-step dx scattered into each context row. */
  dE: Matrix;
}

const zerosMat = (rows: number, cols: number): Matrix =>
  Array.from({ length: rows }, () => zeros(cols));

/** Accumulate the outer product a ⊗ b into A in place (A += a ⊗ b). */
function addOuterInto(A: Matrix, a: number[], b: number[]): void {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) A[i][j] += a[i] * b[j];
  }
}

/** Run the forward pass (the recurrence) for one context block. */
export function forwardPass(model: RnnModel, context: number[]): RnnForward {
  const H = model.bh.length;
  const xs: Matrix = [];
  const zs: Matrix = [];
  const hPrev: Matrix = [];
  const hiddens: Matrix = [];
  let h = zeros(H); // h_0
  for (const c of context) {
    const x = model.E[c];
    const inp = matVecRight(model.Wxh, x, model.bh); // x·W_xh + b_h
    const rec = matVecRight(model.Whh, h, zeros(H)); // h_{t-1}·W_hh
    const z = inp.map((v, i) => v + rec[i]);
    const hNext = tanhVec(z);
    xs.push(x);
    zs.push(z);
    hPrev.push(h);
    hiddens.push(hNext);
    h = hNext;
  }
  const hN = hiddens[hiddens.length - 1] ?? zeros(H);
  const logits = matVecRight(model.Why, hN, model.by);
  return { xs, zs, hPrev, hiddens, hN, logits, probs: softmaxRow(logits) };
}

/** Run the backward pass (BPTT) for one example given its forward intermediates. */
export function backwardPass(model: RnnModel, block: Block, fwd: RnnForward): RnnGrads {
  const d = model.E[0].length;
  const H = model.bh.length;
  const N = block.context.length;

  const dLogits = crossEntropyGrad(fwd.probs, block.target); // p − y
  // Read-out: logits = h_N · W_hy + b_y.
  const dWhy = outer(fwd.hN, dLogits);
  const dby = dLogits.slice();

  const dWxh = zerosMat(d, H);
  const dWhh = zerosMat(H, H);
  const dbh = zeros(H);
  const dE = model.E.map(() => zeros(d));

  // Gradient entering the chain at the last hidden state, then walked back.
  let dh = matVecLeft(model.Why, dLogits); // ∂L/∂h_N, length H
  for (let t = N - 1; t >= 0; t--) {
    const dtanh = dtanhFromOutput(fwd.hiddens[t]); // 1 − h_t²
    const dz = dh.map((g, i) => g * dtanh[i]); // ∂L/∂z_t
    addOuterInto(dWxh, fwd.xs[t], dz); // x_t ⊗ dz
    addOuterInto(dWhh, fwd.hPrev[t], dz); // h_{t-1} ⊗ dz
    for (let i = 0; i < H; i++) dbh[i] += dz[i];
    // Scatter the input-side gradient back into this step's embedding row.
    const dx = matVecLeft(model.Wxh, dz); // length d
    const c = block.context[t];
    for (let j = 0; j < d; j++) dE[c][j] += dx[j];
    // Hand the gradient to the previous step: ∂L/∂h_{t-1} = W_hh · dz.
    dh = matVecLeft(model.Whh, dz);
  }
  return { dLogits, dWhy, dby, dWxh, dWhh, dbh, dE };
}

/** One SGD step: every parameter moves down its gradient by `lr`. */
function sgdStep(model: RnnModel, g: RnnGrads, lr: number): RnnModel {
  return {
    E: stepMatrix(model.E, g.dE, lr),
    Wxh: stepMatrix(model.Wxh, g.dWxh, lr),
    Whh: stepMatrix(model.Whh, g.dWhh, lr),
    bh: stepVec(model.bh, g.dbh, lr),
    Why: stepMatrix(model.Why, g.dWhy, lr),
    by: stepVec(model.by, g.dby, lr),
  };
}

/** Pre-step snapshot for the worked single-step RNN example. */
export type RnnFlash = BlockFlash<RnnForward, RnnGrads>;

export type RnnStepResult = BlockStepResult<RnnModel, RnnForward, RnnGrads>;

/**
 * Strategy for the RNN stage. The example is the same N-token {@link Block} as the
 * MLP (so the corpus slicing is shared); the panels get the usual pair-shaped
 * projection (most recent context token → target) so the shared softmax/gradient
 * panels apply unchanged. The whole step skeleton is inherited from
 * {@link BlockStrategy} — this class supplies only the RNN math.
 */
export class RnnStrategy extends BlockStrategy<RnnModel, RnnForward, RnnGrads> {
  protected forwardPass(model: RnnModel, context: number[]): RnnForward {
    return forwardPass(model, context);
  }

  protected backwardPass(model: RnnModel, block: Block, fwd: RnnForward): RnnGrads {
    return backwardPass(model, block, fwd);
  }

  protected sgdStep(model: RnnModel, grads: RnnGrads, lr: number): RnnModel {
    return sgdStep(model, grads, lr);
  }
}

/** Shared stateless instance — the model lives in the {@link StepTrainer} context. */
export const rnnStrategy = new RnnStrategy();

/** Build a fresh RNN from a seed. Biases start at zero (standard for SGD). */
export function initRnn(
  seed: number,
  vocabSize: number,
  dim: number,
  hiddenSize: number
): RnnModel {
  return {
    E: randomMatrix(seed, vocabSize, dim, 1),
    Wxh: randomMatrix(seed + 1, dim, hiddenSize, 0.5),
    // The recurrent matrix starts small so the short BPTT chain stays well-behaved.
    Whh: randomMatrix(seed + 2, hiddenSize, hiddenSize, 0.3),
    bh: zeros(hiddenSize),
    Why: randomMatrix(seed + 3, hiddenSize, vocabSize, 0.5),
    by: zeros(vocabSize),
  };
}
