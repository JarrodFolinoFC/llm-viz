import { softmaxRow, crossEntropyGrad, meanCrossEntropy, dot, stepVec, scaleVec } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import type { Pair, FlashStep, StepCore, StepContext, TrainerStrategy } from 'mlblocks/core';

/**
 * The embedding ("vector") bigram: instead of a free V×V logit table, the logit
 * for a (prev → next) pair is the dot product of two learned d-dimensional
 * vectors — the prev token's embedding e_a and the next token's unembedding u_b:
 *
 *     logit[a][b] = e_a · u_b          (so the full logit matrix is E · Uᵀ)
 *
 * Softmax + cross-entropy and the p − y gradient are identical to the scalar
 * stage; the new part is that the gradient now flows back into two matrices:
 *
 *     ∂L/∂e_a = Σ_b (p_b − y_b) · u_b
 *     ∂L/∂u_b = (p_b − y_b) · e_a
 *
 * This is the embedding-as-vector / dot-product-score idea that attention's
 * QKᵀ generalises — the next rung toward the transformer.
 */

/** Pre-step snapshot for the worked single-step ("flash") example. */
export interface EmbeddingFlash extends FlashStep {
  /** e_a before the step (length d). */
  prevE: number[];
  /** logits over next tokens before the step (length V). */
  prevLogits: number[];
  /** softmax(prevLogits). */
  prevProbs: number[];
  /** p − y over next tokens (length V). */
  prevGrad: number[];
  /** ∂L/∂e_a = Σ_b prevGrad[b] · u_b, before the step (length d). */
  gradE: number[];
}

export type EmbeddingStepResult = StepCore<EmbeddingFlash> & {
  /** E/U after this step's updates. */
  E: Matrix;
  U: Matrix;
  /** E/U before this step's updates (the "before" panels). */
  EBefore: Matrix;
  UBefore: Matrix;
  /** e_a before the step (length d). */
  prevE: number[];
  /** ∂L/∂e_a (length d). */
  gradE: number[];
};

/** The weight bundle the embedding model carries between steps. */
export interface EmbeddingModel {
  E: Matrix;
  U: Matrix;
}

/** Backward-pass gradients for one (prev → target) pair. */
export interface EmbeddingGrads {
  /** p − y over next tokens (length V). */
  grad: number[];
  /** ∂L/∂e_a = Σ_b grad[b]·u_b (length d). */
  gradE: number[];
}

/** Logits over the next token for `prev`: e_prev · u_b for every b (length V). */
export function forwardPass({ E, U }: EmbeddingModel, prev: number): number[] {
  return U.map((u) => dot(E[prev], u));
}

/** Gradients for a pair, given its forward logits — the single source for the
 *  update step and the flash snapshot alike. */
export function backwardPass(model: EmbeddingModel, target: number, logits: number[]): EmbeddingGrads {
  const grad = crossEntropyGrad(softmaxRow(logits), target);
  return { grad, gradE: gradEFor(grad, model.U) };
}

/** ∂L/∂e_a = Σ_b grad[b]·u_b (length d). */
function gradEFor(grad: number[], U: Matrix): number[] {
  const d = U[0].length;
  const out = new Array<number>(d).fill(0);
  for (let b = 0; b < U.length; b++) {
    for (let i = 0; i < d; i++) out[i] += grad[b] * U[b][i];
  }
  return out;
}

/**
 * Strategy for the embedding ("vector") stage: the logit for a (prev → next)
 * pair is e_a · u_b, so SGD flows the same p − y gradient back into both the
 * embedding E and the unembedding U.
 */
export class EmbeddingStrategy
  implements TrainerStrategy<EmbeddingModel, Pair, EmbeddingFlash, EmbeddingStepResult>
{
  /** Full V×V logit matrix E · Uᵀ — feeds the reused softmax/loss/error code. */
  static logits(E: Matrix, U: Matrix): Matrix {
    return E.map((e) => U.map((u) => dot(e, u)));
  }

  forward(model: EmbeddingModel, pair: Pair): number[] {
    return forwardPass(model, pair.prev);
  }

  toPair(pair: Pair): Pair {
    return pair;
  }

  touchedRows(pair: Pair): number[] {
    return [pair.prev];
  }

  prevLogitsFrom(flash: EmbeddingFlash | null): number[] | undefined {
    return flash?.prevLogits;
  }

  prevGradFrom(flash: EmbeddingFlash | null): number[] | undefined {
    return flash?.prevGrad;
  }

  assemble(
    before: EmbeddingModel,
    after: EmbeddingModel,
    core: StepCore<EmbeddingFlash>
  ): EmbeddingStepResult {
    const { E, U } = after;
    const a = core.currentPair.prev;
    const prevE = core.flash?.prevE ?? E[a].slice();
    const gradE = core.flash?.gradE ?? gradEFor(core.prevGrad, U);
    return {
      ...core,
      E,
      U,
      EBefore: before.E.map((r) => r.slice()),
      UBefore: before.U.map((r) => r.slice()),
      prevE,
      gradE,
    };
  }

  loss({ E, U }: EmbeddingModel, pairs: Pair[]): number {
    return meanCrossEntropy(EmbeddingStrategy.logits(E, U), pairs);
  }

  modelOf(result: EmbeddingStepResult): EmbeddingModel {
    return { E: result.E, U: result.U };
  }

  /** Apply `n` sequential SGD updates to E and U, returning fresh matrices. */
  applyUpdates({ E: E0, U: U0 }: EmbeddingModel, n: number, lr: number, ctx: StepContext<Pair>): EmbeddingModel {
    const model: EmbeddingModel = { E: E0.map((r) => r.slice()), U: U0.map((r) => r.slice()) };
    const { E, U } = model;
    const V = U.length;
    for (let k = 0; k < n; k++) {
      const a = ctx.exampleAt(k).prev;
      const { grad, gradE } = backwardPass(model, ctx.exampleAt(k).target, forwardPass(model, a));
      const eaOld = E[a].slice();
      // e_a ← e_a − η · Σ_b grad[b] · u_b
      E[a] = stepVec(E[a], gradE, lr);
      // u_b ← u_b − η · grad[b] · e_a  (using e_a *before* this step)
      for (let b = 0; b < V; b++) {
        U[b] = stepVec(U[b], scaleVec(eaOld, grad[b]), lr);
      }
    }
    return model;
  }

  flashFor(model: EmbeddingModel, step: number, ctx: StepContext<Pair>): EmbeddingFlash {
    const pairIdx = step % ctx.examples.length;
    const pair = ctx.examples[pairIdx];
    const a = pair.prev;
    const prevLogits = forwardPass(model, a);
    const { grad, gradE } = backwardPass(model, pair.target, prevLogits);
    return {
      prev: a,
      target: pair.target,
      pos: pair.pos,
      pairIdx,
      prevE: model.E[a].slice(),
      prevLogits,
      prevProbs: softmaxRow(prevLogits),
      prevGrad: grad,
      gradE,
    };
  }
}

/** Shared stateless instance — the model lives in the {@link StepTrainer} context. */
export const embeddingStrategy = new EmbeddingStrategy();

/**
 * Weight-tied variant: U IS E — one V×d table serves as both embedding and
 * unembedding (logit[a][b] = e_a · e_b), so the gradients from both roles
 * accumulate into the same rows. This is exactly GPT-2 / nanoGPT's tying of
 * `wte` and `lm_head` (`model.py`: `wte.weight = lm_head.weight`), at toy scale.
 * Everything except the update (and the halved parameter count) is inherited.
 */
export class TiedEmbeddingStrategy extends EmbeddingStrategy {
  applyUpdates({ E: E0 }: EmbeddingModel, n: number, lr: number, ctx: StepContext<Pair>): EmbeddingModel {
    const M = E0.map((r) => r.slice());
    const model: EmbeddingModel = { E: M, U: M };
    for (let k = 0; k < n; k++) {
      const a = ctx.exampleAt(k).prev;
      const { grad, gradE } = backwardPass(model, ctx.exampleAt(k).target, forwardPass(model, a));
      const eaOld = M[a].slice();
      // One accumulated SGD step on the single table: every row gets its
      // u-side nudge −η·(p_b−y_b)·e_a, and row a additionally its e-side pull.
      for (let b = 0; b < M.length; b++) {
        M[b] = stepVec(M[b], scaleVec(eaOld, grad[b]), lr);
      }
      M[a] = stepVec(M[a], gradE, lr);
    }
    return { E: M, U: M };
  }
}

/** Shared stateless instance of the tied variant. */
export const tiedEmbeddingStrategy = new TiedEmbeddingStrategy();
