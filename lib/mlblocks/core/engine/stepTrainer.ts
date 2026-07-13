import { softmaxRowParts, crossEntropyGrad } from '../math/funcs.ts';

/** A training example always knows the next-token it is trying to predict. */
export interface Example {
  target: number;
  /** Corpus token position of the LAST context token (prev for a bigram).
   *  Optional so hand-built examples in tests stay terse; the corpus slicers
   *  always set it. The corpus-highlight panels use this — not the example's
   *  index — so highlighting survives a shuffled training order. */
  pos?: number;
}

/** A single (prev → next) bigram example. */
export interface Pair extends Example {
  prev: number;
}

/**
 * The common core of a single-step ("flash") snapshot: the {prev → target} the
 * panels label with, plus its index in the examples list. Every concrete
 * trainer extends this with its own model-specific quantities — so panels
 * shared by all flows depend on this lean, pair-shaped projection, not on any
 * one model's example (a single token for the bigram, a block for the MLP).
 */
export interface FlashStep extends Pair {
  pairIdx: number;
}

/**
 * Per-step derived quantities every trainer produces, model weights excluded.
 * View-row packing (the `[logit, exp, prob]` tuples the table panels render)
 * lives in the view layer — this stays the ML. `currentPair` is the pair-shaped
 * projection of the current example, so the shared panels stay model-agnostic.
 */
export interface StepCore<TFlash extends FlashStep> {
  step: number;
  flash: TFlash | null;
  pairIdx: number;
  currentPair: Pair;
  trainedRows: Set<number>;
  currentLogits: number[];
  currentExps: number[];
  currentExpSum: number;
  currentProbs: number[];
  currentLoss: number;
  prevLogits: number[];
  prevExps: number[];
  prevExpSum: number;
  prevProbs: number[];
  prevGrad: number[];
}

/** Read-only per-step context the strategy is handed (the examples + cursor). */
export interface StepContext<TExample extends Example> {
  readonly examples: TExample[];
  /** The example trained on the k-th of this call's sequential updates. */
  exampleAt(k: number): TExample;
}

/**
 * The training/eval half of a model: how it updates and how it scores. Depends
 * only on the model + example types — no flash/result/view machinery — so
 * narrow consumers (corpus scoring, evaluation, inference) can take this view
 * without dragging in the visualization methods (ISP).
 *
 * @typeParam TModel   the weight bundle (e.g. `Matrix`, `{E,U}`, the MLP params)
 * @typeParam TExample the training example (a `Pair`, or an N-token block)
 */
export interface TrainableModel<TModel, TExample extends Example> {
  /** Apply `n` sequential SGD updates to `model`, returning a fresh model. */
  applyUpdates(model: TModel, n: number, lr: number, ctx: StepContext<TExample>): TModel;
  /** Logits over the next token for one example, from the post-update model. */
  forward(model: TModel, example: TExample): number[];
  /**
   * Mean cross-entropy of `model` over the whole corpus — the loss-curve value.
   * Owned by the model (each variant scores differently), so callers depend on
   * this method instead of any one model's internal shape.
   */
  loss(model: TModel, examples: TExample[]): number;
}

/**
 * The visualization half: everything the step-by-step UI needs to label, replay,
 * and fold a worked example. Kept separate from {@link TrainableModel} (ISP), so
 * the parts of the system that only train or only score don't depend on it.
 *
 *  - {@link toPair}        – project an example to the {prev,target} panels label with
 *  - {@link touchedRows}   – which embedding/weight rows an example reads
 *  - {@link flashFor}      – the pre-step snapshot for a worked example
 *  - {@link prevLogitsFrom}/{@link prevGradFrom} – which flash fields the
 *    bottom-row panels replay (return `undefined` to recompute from `prev`)
 *  - {@link assemble}      – fold the before/after models into its result shape
 *  - {@link modelOf}       – read the model back out of a step result
 *
 * @typeParam TFlash  the model-specific flash snapshot
 * @typeParam TResult the model-specific step result
 */
export interface StepViewAdapter<TModel, TExample extends Example, TFlash extends FlashStep, TResult> {
  /** Project an example to the pair-shaped highlight the shared panels render. */
  toPair(example: TExample): Pair;
  /** Embedding/weight rows this example reads (for the "trained so far" highlight). */
  touchedRows(example: TExample): Iterable<number>;
  /** Pre-step ("flash") snapshot for a single worked example. */
  flashFor(model: TModel, step: number, ctx: StepContext<TExample>): TFlash;
  /** Pre-step logits the panels replay (undefined ⇒ reuse the current row). */
  prevLogitsFrom(flash: TFlash | null): number[] | undefined;
  /** Pre-step gradient the panels replay (undefined ⇒ recompute from prev). */
  prevGradFrom(flash: TFlash | null): number[] | undefined;
  /** Fold the before/after models into the model-specific result shape. */
  assemble(before: TModel, after: TModel, core: StepCore<TFlash>): TResult;
  /** Read the model back out of a step result (the inverse of {@link assemble}). */
  modelOf(result: TResult): TModel;
}

/**
 * The full per-model algorithm: the {@link TrainableModel} math plus its
 * {@link StepViewAdapter}. Each model variant — free V×V logit table, embedding
 * dot-product, MLP, RNN, and the many more to come — is one `TrainerStrategy`;
 * {@link StepTrainer} is the fixed context that runs the shared per-step skeleton
 * and delegates every model-specific decision here. {@link StepTrainer} needs
 * both halves; narrower consumers can depend on just one.
 *
 * Strategies are stateless: the model is owned by the context and passed in, so
 * one strategy instance serves every step and every trainer of its kind.
 */
export interface TrainerStrategy<TModel, TExample extends Example, TFlash extends FlashStep, TResult>
  extends TrainableModel<TModel, TExample>,
    StepViewAdapter<TModel, TExample, TFlash, TResult> {}

/**
 * Strategy-pattern context: owns the corpus examples, the step cursor, and the
 * current model, and runs the invariant per-step skeleton — advance the step,
 * flash the run's final update as the worked example, run the softmax +
 * cross-entropy forward, pack the shared {@link StepCore} — delegating every
 * model-specific decision to its injected {@link TrainerStrategy}.
 */
export class StepTrainer<TModel, TExample extends Example, TFlash extends FlashStep, TResult>
  implements StepContext<TExample>
{
  constructor(
    readonly examples: TExample[],
    readonly step: number,
    private readonly model: TModel,
    private readonly strategy: TrainerStrategy<TModel, TExample, TFlash, TResult>
  ) {}

  doStep(n: number, lr: number): TResult {
    // Apply all but the last update, snapshot, then apply the last one — so a
    // multi-step run (+10 / Epoch) still ends with a true worked example of its
    // final step: the "before" panels and the −η·∇ deltas always describe one
    // real update, never an accumulated span next to a single-step gradient.
    const beforeLast =
      n > 1 ? this.strategy.applyUpdates(this.model, n - 1, lr, this) : this.model;
    const lastStep = this.step + Math.max(n - 1, 0);
    const lastCtx: StepContext<TExample> = {
      examples: this.examples,
      exampleAt: (k) => this.examples[(lastStep + k) % this.examples.length],
    };
    const flash = n >= 1 ? this.strategy.flashFor(beforeLast, lastStep, lastCtx) : null;
    const after = n >= 1 ? this.strategy.applyUpdates(beforeLast, 1, lr, lastCtx) : beforeLast;
    const step = this.step + n;
    const pairIdx = step === 0 ? 0 : (step - 1) % this.examples.length;
    const currentExample = this.examples[pairIdx];
    const currentPair = this.strategy.toPair(currentExample);

    const currentLogits = this.strategy.forward(after, currentExample);
    const current = softmaxRowParts(currentLogits);
    const currentLoss = -Math.log(Math.max(current.probs[currentPair.target], 1e-12));

    // The bottom-row panels replay the pre-update state for the trained example.
    const prevLogits = this.strategy.prevLogitsFrom(flash) ?? currentLogits;
    const prev = softmaxRowParts(prevLogits);
    const prevGrad =
      this.strategy.prevGradFrom(flash) ?? crossEntropyGrad(prev.probs, currentPair.target);

    const core: StepCore<TFlash> = {
      step,
      flash,
      pairIdx,
      currentPair,
      trainedRows: this.trainedRowsAt(step),
      currentLogits,
      currentExps: current.exps,
      currentExpSum: current.expSum,
      currentProbs: current.probs,
      currentLoss,
      prevLogits,
      prevExps: prev.exps,
      prevExpSum: prev.expSum,
      prevProbs: prev.probs,
      prevGrad,
    };
    // `beforeLast` (not the pre-run model) is the "before" the strategies fold
    // in, so every after − before delta equals −η·(the flashed gradient).
    return this.strategy.assemble(beforeLast, after, core);
  }

  exampleAt(k: number): TExample {
    return this.examples[(this.step + k) % this.examples.length];
  }

  /** Which embedding/weight rows have been touched by step `step`. */
  private trainedRowsAt(step: number): Set<number> {
    const rows = new Set<number>();
    const trained = Math.min(step, this.examples.length);
    for (let k = 0; k < trained; k++) {
      for (const r of this.strategy.touchedRows(this.examples[k])) rows.add(r);
    }
    return rows;
  }
}
