import { randomMatrix, softmaxRow, sgdRowUpdate } from 'mlblocks/core';
import type { Block, FlashStep, Pair, StepCore, StepContext, TrainerStrategy } from 'mlblocks/core';

/** The trigram model: a V×V×V logit tensor — `W[c][a]` is the next-token
 *  logit row for the two-token context (c, a). */
export type Tensor3 = number[][][];

/** Pre-step snapshot for the worked single-step trigram update. */
export interface TrigramFlash extends FlashStep {
  /** The FIRST context token c (the one before `prev`) — which slice trained. */
  c: number;
  /** Row W[c][a] before this step's update (length V). */
  prevRow: number[];
}

export type TrigramStepResult = StepCore<TrigramFlash> & { W: Tensor3 };

/**
 * Strategy for the trigram scalar stage: a free V×V×V logit tensor where each
 * (c, a) context pair owns its own next-token logit row, and SGD nudges one
 * row per step — the bigram table with one more conditioning axis. Parameter
 * count is V³ (512 at V=8), which is the pedagogical point: n-gram tables grow
 * exponentially with context length, which is why the MLP compresses the
 * context through embeddings instead.
 */
export class TrigramStrategy implements TrainerStrategy<Tensor3, Block, TrigramFlash, TrigramStepResult> {
  applyUpdates(W: Tensor3, n: number, lr: number, ctx: StepContext<Block>): Tensor3 {
    const next = W.map((slice) => slice.map((row) => row.slice()));
    for (let k = 0; k < n; k++) {
      const block = ctx.exampleAt(k);
      const [c, a] = block.context;
      next[c][a] = sgdRowUpdate(next[c][a], block.target, lr);
    }
    return next;
  }

  forward(W: Tensor3, block: Block): number[] {
    const [c, a] = block.context;
    return W[c][a];
  }

  /** The pair-shaped projection the shared panels label with: the most recent
   *  context token → target (same convention as the MLP/RNN block stages). */
  toPair(block: Block): Pair {
    return { prev: block.context[1], target: block.target, pos: block.pos };
  }

  touchedRows(block: Block): number[] {
    return [block.context[1]];
  }

  flashFor(W: Tensor3, step: number, ctx: StepContext<Block>): TrigramFlash {
    const pairIdx = step % ctx.examples.length;
    const block = ctx.examples[pairIdx];
    const [c, a] = block.context;
    return { c, prev: a, target: block.target, pos: block.pos, pairIdx, prevRow: W[c][a].slice() };
  }

  prevLogitsFrom(flash: TrigramFlash | null): number[] | undefined {
    return flash?.prevRow;
  }

  prevGradFrom(): undefined {
    return undefined;
  }

  assemble(_before: Tensor3, after: Tensor3, core: StepCore<TrigramFlash>): TrigramStepResult {
    return { ...core, W: after };
  }

  loss(W: Tensor3, blocks: Block[]): number {
    if (blocks.length === 0) return 0;
    let sum = 0;
    for (const block of blocks) {
      const [c, a] = block.context;
      const probs = softmaxRow(W[c][a]);
      sum += -Math.log(Math.max(probs[block.target], 1e-12));
    }
    return sum / blocks.length;
  }

  modelOf(result: TrigramStepResult): Tensor3 {
    return result.W;
  }
}

/** Shared stateless instance — the model lives in the {@link StepTrainer} context. */
export const trigramStrategy = new TrigramStrategy();

/** Fresh random V×V×V logits, one seeded V×V slice per first-context token. */
export function initTrigram(seed: number, V: number): Tensor3 {
  return Array.from({ length: V }, (_, c) => randomMatrix(seed + 31 * c, V, V, 1));
}
