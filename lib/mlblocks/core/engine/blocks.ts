import { tokenize, tokenIds } from '../math/funcs';
import type { Block } from './example';
import type { TrainableModel } from './stepTrainer';

/**
 * Slice a corpus into fixed-width n-gram training blocks: every position with at
 * least `blockSize` tokens of history becomes one (context → next) example. No
 * padding — the first `blockSize` tokens only ever appear as context.
 */
export function trainingBlocks(
  corpus: string,
  vocab: readonly string[],
  blockSize: number
): Block[] {
  const ids = tokenIds(tokenize(corpus), vocab);
  const blocks: Block[] = [];
  for (let i = blockSize; i < ids.length; i++) {
    const context = ids.slice(i - blockSize, i);
    // Skip any window touching an out-of-vocab token (id −1) — mirrors the
    // bigram path's OOV filtering, so a model can never index E[-1].
    if (ids[i] < 0 || context.some((c) => c < 0)) continue;
    // pos = the last context token's corpus position (target sits at pos + 1),
    // so the corpus highlight survives a shuffled training order.
    blocks.push({ context, target: ids[i], pos: i - 1 });
  }
  return blocks;
}

/**
 * Mean cross-entropy of a block model over every training block. A thin pass to
 * the model's own loss (so there is a single source of truth), taking the model
 * by its narrow {@link TrainableModel} view rather than depending on any one
 * concrete strategy.
 */
export function meanBlockLoss<TModel>(
  model: TModel,
  blocks: Block[],
  strategy: TrainableModel<TModel, Block>
): number {
  return strategy.loss(model, blocks);
}
