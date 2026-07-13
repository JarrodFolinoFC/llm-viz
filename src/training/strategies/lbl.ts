import {
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
 * The log-bilinear n-gram model: the Bengio MLP with the hidden layer deleted.
 * The N previous tokens are embedded, concatenated, and projected STRAIGHT to
 * logits — no tanh, no hidden layer:
 *
 *     x      = [E[c₁] ; … ; E[c_N]]        (concatenated embeddings, length D = N·d)
 *     logits = x · W + b                    (length V)
 *
 * Each logit is a bilinear form in two learned vectors — the (position-wise)
 * context embeddings and W's output column for the candidate word — which is
 * exactly the log-bilinear family (Mnih & Hinton 2007; also Bengio's
 * "direct connections" path). One rung between the trigram's free table
 * (nothing shared between contexts) and the MLP (a nonlinear hidden layer):
 * contexts now SHARE structure through the embeddings, but the combination
 * rule is purely linear.
 */

/** Log-bilinear parameters: a token embedding plus one affine output layer. */
export interface LblModel {
  /** V × d — one learned embedding per token. */
  E: Matrix;
  /** D × V, where D = N·d — output projection (one column per next token). */
  W: Matrix;
  /** V — output bias. */
  b: number[];
}

/** Forward-pass intermediates for one example — what the forward panels render. */
export interface LblForward {
  /** N·d concatenated context embeddings. */
  x: number[];
  /** V output logits (x·W + b). */
  logits: number[];
  /** V softmax(logits). */
  probs: number[];
}

/** Backward-pass gradients for one example — what the backprop panels render. */
export interface LblGrads {
  /** V — ∂L/∂logits = p − y. */
  dLogits: number[];
  /** D × V — ∂L/∂W = x ⊗ dLogits. */
  dW: Matrix;
  /** V — ∂L/∂b. */
  db: number[];
  /** D — ∂L/∂x = W · dLogits. */
  dx: number[];
  /** V × d — ∂L/∂E, the scattered dx accumulated into each context row. */
  dE: Matrix;
}

/** Run the forward pass for one context block. */
export function forwardPass(model: LblModel, context: number[]): LblForward {
  const x = context.flatMap((c) => model.E[c]);
  const logits = matVecRight(model.W, x, model.b);
  return { x, logits, probs: softmaxRow(logits) };
}

/** Run the backward pass for one example given its forward intermediates. */
export function backwardPass(model: LblModel, block: Block, fwd: LblForward): LblGrads {
  const d = model.E[0].length;
  const dLogits = crossEntropyGrad(fwd.probs, block.target); // p − y
  // Output layer: logits = x · W + b.
  const dW = outer(fwd.x, dLogits);
  const db = dLogits.slice();
  const dx = matVecLeft(model.W, dLogits);
  // Scatter dx back into the embedding rows of the context tokens (accumulating
  // when a token appears more than once in the block).
  const dE = model.E.map(() => zeros(d));
  block.context.forEach((c, i) => {
    for (let j = 0; j < d; j++) dE[c][j] += dx[i * d + j];
  });
  return { dLogits, dW, db, dx, dE };
}

/** One SGD step: every parameter moves down its gradient by `lr`. */
function sgdStep(model: LblModel, g: LblGrads, lr: number): LblModel {
  return {
    E: stepMatrix(model.E, g.dE, lr),
    W: stepMatrix(model.W, g.dW, lr),
    b: stepVec(model.b, g.db, lr),
  };
}

/** Pre-step snapshot for the worked single-step log-bilinear example. */
export type LblFlash = BlockFlash<LblForward, LblGrads>;

export type LblStepResult = BlockStepResult<LblModel, LblForward, LblGrads>;

/**
 * Strategy for the log-bilinear stage. Everything but the three-line math is
 * inherited from {@link BlockStrategy} — same skeleton as the MLP and RNN.
 */
export class LblStrategy extends BlockStrategy<LblModel, LblForward, LblGrads> {
  protected forwardPass(model: LblModel, context: number[]): LblForward {
    return forwardPass(model, context);
  }

  protected backwardPass(model: LblModel, block: Block, fwd: LblForward): LblGrads {
    return backwardPass(model, block, fwd);
  }

  protected sgdStep(model: LblModel, grads: LblGrads, lr: number): LblModel {
    return sgdStep(model, grads, lr);
  }
}

/** Shared stateless instance — the model lives in the {@link StepTrainer} context. */
export const lblStrategy = new LblStrategy();

/** Build a fresh log-bilinear model from a seed. Bias starts at zero. */
export function initLbl(seed: number, vocabSize: number, dim: number, blockSize: number): LblModel {
  const D = blockSize * dim;
  return {
    E: randomMatrix(seed, vocabSize, dim, 1),
    W: randomMatrix(seed + 1, D, vocabSize, 0.5),
    b: zeros(vocabSize),
  };
}
