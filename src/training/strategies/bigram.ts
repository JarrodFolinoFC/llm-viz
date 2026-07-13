import { sgdRowUpdate, meanCrossEntropy } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import type { Pair, FlashStep, StepCore, StepContext, TrainerStrategy } from 'mlblocks/core';

/** Pre-step snapshot for the worked single-step bigram update. */
export interface BigramFlash extends FlashStep {
  /** Row a of W before this step's update (length V). */
  prevRow: number[];
}

export type BigramStepResult = StepCore<BigramFlash> & { W: Matrix };

/**
 * Strategy for the scalar stage: a free V×V logit table `W`, where each row is
 * the next-token logits for one prev token and SGD nudges one row per step.
 */
export class BigramStrategy implements TrainerStrategy<Matrix, Pair, BigramFlash, BigramStepResult> {
  applyUpdates(W: Matrix, n: number, lr: number, ctx: StepContext<Pair>): Matrix {
    const next = W.map((r) => r.slice());
    for (let k = 0; k < n; k++) {
      const pair = ctx.exampleAt(k);
      next[pair.prev] = sgdRowUpdate(next[pair.prev], pair.target, lr);
    }
    return next;
  }

  forward(W: Matrix, pair: Pair): number[] {
    return W[pair.prev];
  }

  toPair(pair: Pair): Pair {
    return pair;
  }

  touchedRows(pair: Pair): number[] {
    return [pair.prev];
  }

  flashFor(W: Matrix, step: number, ctx: StepContext<Pair>): BigramFlash {
    const pairIdx = step % ctx.examples.length;
    const pair = ctx.examples[pairIdx];
    return { prev: pair.prev, target: pair.target, pos: pair.pos, pairIdx, prevRow: W[pair.prev].slice() };
  }

  prevLogitsFrom(flash: BigramFlash | null): number[] | undefined {
    return flash?.prevRow;
  }

  prevGradFrom(): undefined {
    return undefined;
  }

  assemble(_before: Matrix, after: Matrix, core: StepCore<BigramFlash>): BigramStepResult {
    return { ...core, W: after };
  }

  loss(W: Matrix, pairs: Pair[]): number {
    return meanCrossEntropy(W, pairs);
  }

  modelOf(result: BigramStepResult): Matrix {
    return result.W;
  }
}

/** Shared stateless instance — the model lives in the {@link StepTrainer} context. */
export const bigramStrategy = new BigramStrategy();
