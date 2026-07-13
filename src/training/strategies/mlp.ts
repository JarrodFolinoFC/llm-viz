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
 * Stage 3 — the Bengio-style neural bigram/n-gram language model. Instead of a
 * free logit table (scalar stage) or a single dot product (vector stage), the N
 * previous tokens are embedded, concatenated, and pushed through one tanh hidden
 * layer and an output projection:
 *
 *     x      = [E[c₁] ; … ; E[c_N]]        (concatenated embeddings, length D = N·d)
 *     h      = tanh(x · W1 + b1)            (hidden, length H)
 *     logits = h · W2 + b2                  (length V)
 *
 * Softmax + cross-entropy are identical to the earlier stages; the new part is
 * backprop carrying the p − y gradient through W2, the tanh, W1, and finally
 * scattering it back into the embedding rows of the N context tokens. This is
 * the multi-layer perceptron that the attention block later generalises.
 */

/** MLP-LM parameters: a token embedding plus two affine layers. */
export interface MlpModel {
  /** V × d — one learned embedding per token. */
  E: Matrix;
  /** D × H, where D = N·d — hidden layer weights. */
  W1: Matrix;
  /** H — hidden layer bias. */
  b1: number[];
  /** H × V — output (unembedding) weights. */
  W2: Matrix;
  /** V — output bias. */
  b2: number[];
}

/** Forward-pass intermediates for one example — what the forward panels render. */
export interface MlpForward {
  /** N·d concatenated context embeddings. */
  x: number[];
  /** H hidden pre-activations (x·W1 + b1). */
  z1: number[];
  /** H hidden activations tanh(z1). */
  hidden: number[];
  /** V output logits (h·W2 + b2). */
  logits: number[];
  /** V softmax(logits). */
  probs: number[];
}

/** Backward-pass gradients for one example — what the backprop panels render. */
export interface MlpGrads {
  /** V — ∂L/∂logits = p − y. */
  dLogits: number[];
  /** H × V — ∂L/∂W2 = hidden ⊗ dLogits. */
  dW2: Matrix;
  /** V — ∂L/∂b2. */
  db2: number[];
  /** H — ∂L/∂hidden. */
  dHidden: number[];
  /** H — ∂L/∂z1 = dHidden · (1 − h²). */
  dz1: number[];
  /** D × H — ∂L/∂W1 = x ⊗ dz1. */
  dW1: Matrix;
  /** H — ∂L/∂b1. */
  db1: number[];
  /** D — ∂L/∂x. */
  dx: number[];
  /** V × d — ∂L/∂E, the scattered dx accumulated into each context row. */
  dE: Matrix;
}

/** Run the forward pass for one context block. */
export function forwardPass(model: MlpModel, context: number[]): MlpForward {
  const x = context.flatMap((c) => model.E[c]);
  const z1 = matVecRight(model.W1, x, model.b1);
  const hidden = tanhVec(z1);
  const logits = matVecRight(model.W2, hidden, model.b2);
  return { x, z1, hidden, logits, probs: softmaxRow(logits) };
}

/** Run the backward pass for one example given its forward intermediates. */
export function backwardPass(model: MlpModel, block: Block, fwd: MlpForward): MlpGrads {
  const d = model.E[0].length;
  const dLogits = crossEntropyGrad(fwd.probs, block.target); // p − y
  // Output layer: logits = hidden · W2 + b2.
  const dW2 = outer(fwd.hidden, dLogits);
  const db2 = dLogits.slice();
  const dHidden = matVecLeft(model.W2, dLogits);
  // tanh: dz1 = dHidden ⊙ (1 − h²).
  const dtanh = dtanhFromOutput(fwd.hidden);
  const dz1 = dHidden.map((g, i) => g * dtanh[i]);
  // Hidden layer: z1 = x · W1 + b1.
  const dW1 = outer(fwd.x, dz1);
  const db1 = dz1.slice();
  const dx = matVecLeft(model.W1, dz1);
  // Scatter dx back into the embedding rows of the context tokens (accumulating
  // when a token appears more than once in the block).
  const dE = model.E.map(() => zeros(d));
  block.context.forEach((c, i) => {
    for (let j = 0; j < d; j++) dE[c][j] += dx[i * d + j];
  });
  return { dLogits, dW2, db2, dHidden, dz1, dW1, db1, dx, dE };
}

/** One SGD step: every parameter moves down its gradient by `lr`. */
function sgdStep(model: MlpModel, g: MlpGrads, lr: number): MlpModel {
  return {
    E: stepMatrix(model.E, g.dE, lr),
    W1: stepMatrix(model.W1, g.dW1, lr),
    b1: stepVec(model.b1, g.db1, lr),
    W2: stepMatrix(model.W2, g.dW2, lr),
    b2: stepVec(model.b2, g.db2, lr),
  };
}

/** Pre-step snapshot for the worked single-step MLP example. */
export type MlpFlash = BlockFlash<MlpForward, MlpGrads>;

export type MlpStepResult = BlockStepResult<MlpModel, MlpForward, MlpGrads>;

/**
 * Strategy for the MLP stage. The example is an N-token {@link Block} rather than
 * a single pair; the panels still get a pair-shaped projection (the most recent
 * context token → target) so the shared softmax/gradient panels apply. The whole
 * step skeleton is inherited from {@link BlockStrategy} — this class supplies
 * only the MLP math.
 */
export class MlpStrategy extends BlockStrategy<MlpModel, MlpForward, MlpGrads> {
  protected forwardPass(model: MlpModel, context: number[]): MlpForward {
    return forwardPass(model, context);
  }

  protected backwardPass(model: MlpModel, block: Block, fwd: MlpForward): MlpGrads {
    return backwardPass(model, block, fwd);
  }

  protected sgdStep(model: MlpModel, grads: MlpGrads, lr: number): MlpModel {
    return sgdStep(model, grads, lr);
  }
}

/** Shared stateless instance — the model lives in the {@link StepTrainer} context. */
export const mlpStrategy = new MlpStrategy();

/** Build a fresh MLP from a seed. Biases start at zero (standard for SGD). */
export function initMlp(
  seed: number,
  vocabSize: number,
  dim: number,
  blockSize: number,
  hiddenSize: number
): MlpModel {
  const D = blockSize * dim;
  return {
    E: randomMatrix(seed, vocabSize, dim, 1),
    W1: randomMatrix(seed + 1, D, hiddenSize, 0.5),
    b1: zeros(hiddenSize),
    W2: randomMatrix(seed + 2, hiddenSize, vocabSize, 0.5),
    b2: zeros(vocabSize),
  };
}
