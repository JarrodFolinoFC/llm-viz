import type { Block } from './example';
import type {
  Pair,
  FlashStep,
  StepCore,
  StepContext,
  TrainerStrategy,
} from './stepTrainer';

/**
 * The least a block stage's forward pass must expose for the shared step
 * skeleton: the output logits and their softmax. Concrete stages extend this
 * with their own intermediates (hidden activations, per-step states, …) for
 * their panels to render.
 */
export interface BlockForwardCore {
  /** V output logits. */
  logits: number[];
  /** V softmax(logits). */
  probs: number[];
}

/** The least a block stage's backward pass must expose: ∂L/∂logits = p − y. */
export interface BlockGradsCore {
  /** V — ∂L/∂logits = p − y. */
  dLogits: number[];
}

/** Pre-step snapshot for the worked single-step example of a block stage. */
export interface BlockFlash<TForward extends BlockForwardCore, TGrads extends BlockGradsCore>
  extends FlashStep {
  /** The N context token ids of the flashed example. */
  context: number[];
  /** Forward intermediates, computed on the pre-update model. */
  forward: TForward;
  /** Backward gradients, computed on the pre-update model. */
  grads: TGrads;
  prevLogits: number[];
  prevProbs: number[];
  prevGrad: number[];
}

/** Step result of a block stage: the shared core plus the before/after models. */
export type BlockStepResult<
  TModel,
  TForward extends BlockForwardCore,
  TGrads extends BlockGradsCore,
> = StepCore<BlockFlash<TForward, TGrads>> & {
  /** Parameters after this step's updates. */
  after: TModel;
  /** Parameters before this step's updates (the "before"/delta panels). */
  before: TModel;
};

/**
 * Template-method base for the N-token block stages (MLP, RNN, and whatever
 * comes next). These stages all train on the same {@link Block} slices of the
 * corpus and differ only in the math of one example — how a context block is
 * pushed forward to logits, how the p − y gradient flows back to parameter
 * gradients, and how SGD applies them. Those three are the abstract steps;
 * everything else in the {@link TrainerStrategy} contract — the sequential
 * update loop, the pair-shaped projection the shared panels label with (most
 * recent context token → target), the flash snapshot, the before/after fold,
 * and the mean cross-entropy loss — is implemented here once.
 *
 * Subclasses stay stateless (the model lives in the {@link StepContext}
 * owner), so one instance serves every step and every trainer of its kind.
 *
 * @typeParam TModel   the stage's weight bundle (e.g. the MLP or RNN params)
 * @typeParam TForward the stage's forward intermediates (must expose logits + probs)
 * @typeParam TGrads   the stage's gradients (must expose dLogits)
 */
export abstract class BlockStrategy<
  TModel,
  TForward extends BlockForwardCore,
  TGrads extends BlockGradsCore,
> implements
    TrainerStrategy<TModel, Block, BlockFlash<TForward, TGrads>, BlockStepResult<TModel, TForward, TGrads>>
{
  /** Run the forward pass for one context block. */
  protected abstract forwardPass(model: TModel, context: number[]): TForward;

  /** Run the backward pass for one example given its forward intermediates. */
  protected abstract backwardPass(model: TModel, block: Block, fwd: TForward): TGrads;

  /** One SGD step: every parameter moves down its gradient by `lr`. */
  protected abstract sgdStep(model: TModel, grads: TGrads, lr: number): TModel;

  applyUpdates(model: TModel, n: number, lr: number, ctx: StepContext<Block>): TModel {
    let m = model;
    for (let k = 0; k < n; k++) {
      const block = ctx.exampleAt(k);
      const fwd = this.forwardPass(m, block.context);
      m = this.sgdStep(m, this.backwardPass(m, block, fwd), lr);
    }
    return m;
  }

  forward(model: TModel, block: Block): number[] {
    return this.forwardPass(model, block.context).logits;
  }

  toPair(block: Block): Pair {
    return { prev: block.context[block.context.length - 1], target: block.target };
  }

  touchedRows(block: Block): number[] {
    return block.context;
  }

  flashFor(model: TModel, step: number, ctx: StepContext<Block>): BlockFlash<TForward, TGrads> {
    const pairIdx = step % ctx.examples.length;
    const block = ctx.examples[pairIdx];
    const forward = this.forwardPass(model, block.context);
    const grads = this.backwardPass(model, block, forward);
    return {
      prev: block.context[block.context.length - 1],
      target: block.target,
      pos: block.pos,
      pairIdx,
      context: block.context,
      forward,
      grads,
      prevLogits: forward.logits,
      prevProbs: forward.probs,
      prevGrad: grads.dLogits,
    };
  }

  prevLogitsFrom(flash: BlockFlash<TForward, TGrads> | null): number[] | undefined {
    return flash?.prevLogits;
  }

  prevGradFrom(flash: BlockFlash<TForward, TGrads> | null): number[] | undefined {
    return flash?.prevGrad;
  }

  assemble(
    before: TModel,
    after: TModel,
    core: StepCore<BlockFlash<TForward, TGrads>>
  ): BlockStepResult<TModel, TForward, TGrads> {
    return { ...core, after, before };
  }

  loss(model: TModel, blocks: Block[]): number {
    if (blocks.length === 0) return 0;
    const total = blocks.reduce((sum, block) => {
      const { probs } = this.forwardPass(model, block.context);
      return sum - Math.log(Math.max(probs[block.target], 1e-12));
    }, 0);
    return total / blocks.length;
  }

  modelOf(result: BlockStepResult<TModel, TForward, TGrads>): TModel {
    return result.after;
  }
}
