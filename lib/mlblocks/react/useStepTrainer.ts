import { useMemo, useState } from 'react';

import { seededShuffle } from '../core/math/funcs';
import { StepTrainer, type Example, type FlashStep, type StepCore, type TrainerStrategy } from '../core/engine/stepTrainer';
import { PRECISION, type Precision } from '../core/precision';

/** One point on the loss curve. */
export interface LossPoint {
  step: number;
  loss: number;
}

/** One model snapshot on the weight-history timeline. */
export interface ModelPoint<TModel> {
  step: number;
  model: TModel;
}

export interface StepTrainerController<TResult, TModel = unknown> {
  /** The latest step result (model + derived quantities). */
  result: TResult;
  /** Loss at step 0 and after every `doStep`. */
  history: LossPoint[];
  /** Model snapshot at step 0 and after every `doStep` — the per-weight
   *  history the sparkline panels chart. Same cadence as `history`. */
  modelHistory: ModelPoint<TModel>[];
  seed: number;
  setSeed: (seed: number) => void;
  lr: number;
  setLr: (lr: number) => void;
  /** Train on a seeded shuffle of the examples instead of corpus order. */
  shuffle: boolean;
  setShuffle: (shuffle: boolean) => void;
  /** Apply `n` SGD updates (default 1) and record the new loss. */
  doStep: (n?: number) => void;
  /** Re-initialise from the current seed (fresh weights, empty history). */
  reset: () => void;
}

/**
 * Mount-time overrides sourced from the URL (see {@link TrainerUrlState}), so a
 * bookmarked link reproduces a run. Each field falls back to the page default
 * when absent. `step` is replayed once on first mount — deterministically, since
 * the trainer is a pure function of seed/order/lr — so the URL lands on the same
 * model. A later user seed/precision change still resets to step 0 (the replay
 * lives only in the initial state, never in a re-init).
 */
export interface TrainerInitial {
  seed?: number;
  lr?: number;
  shuffle?: boolean;
  step?: number;
}

/** Upper bound on the URL's replayed steps, so a pasted `step=999999` can't hang the tab. */
const MAX_REPLAY_STEPS = 5000;

interface UseStepTrainerArgs<TModel, TExample extends Example, TFlash extends FlashStep, TResult> {
  /** The corpus examples (memoised by the caller; its identity drives re-init). */
  examples: TExample[];
  /** The per-model algorithm. */
  strategy: TrainerStrategy<TModel, TExample, TFlash, TResult>;
  /** Build fresh weights for a seed. */
  init: (seed: number) => TModel;
  /** Initial learning rate. */
  lr0: number;
  /** Initial seed (default 1). */
  seed0?: number;
  /** URL-sourced mount overrides (seed/lr/shuffle/step). */
  initial?: TrainerInitial;
  /** The run's decimal precision — part of its identity, like `seed`:
   *  changing it re-inits to step 0 (a deliberate clean slate). Display-only
   *  in the arithmetic sense (no math reads it), but a shared link's `?p=`
   *  must reproduce the same run. */
  precision?: Precision;
}

/**
 * The shared training-flow lifecycle, lifted out of the per-stage containers:
 * seed/lr/shuffle state, the initial + re-init bootstrap, `doStep`, `reset`, and
 * the loss history. Every model-specific decision is delegated to the injected
 * {@link TrainerStrategy} (weights via `init`, loss via `strategy.loss`, the
 * next model via `strategy.modelOf`), so this is fully model-agnostic — adding a
 * stage no longer means re-implementing this skeleton.
 */
export function useStepTrainer<TModel, TExample extends Example, TFlash extends FlashStep, TResult extends StepCore<TFlash>>(
  { examples, strategy, init, lr0, seed0 = 1, initial, precision = PRECISION }: UseStepTrainerArgs<TModel, TExample, TFlash, TResult>,
): StepTrainerController<TResult, TModel> {
  const [seed, setSeed] = useState(initial?.seed ?? seed0);
  const [lr, setLr] = useState(initial?.lr ?? lr0);
  // Corpus order replays the same sequence every epoch (a visible per-epoch
  // rhythm in the loss curve); the shuffle is seeded so runs stay reproducible.
  // Real training loops (nanoGPT included) sample batches randomly.
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? false);

  const ordered = useMemo(
    () => (shuffle ? seededShuffle(examples, seed) : examples),
    [examples, shuffle, seed],
  );

  const run = (model: TModel, step: number, n: number): TResult =>
    new StepTrainer(ordered, step, model, strategy).doStep(n, lr);

  // The result and the two histories only ever move together (doStep appends
  // to both, a re-init rebuilds all three), so they live in one state atom —
  // the "history matches result" invariant can't be broken by a missed setter.
  interface TrainerState {
    result: TResult;
    history: LossPoint[];
    modelHistory: ModelPoint<TModel>[];
  }
  // Append one SGD step to a trainer state (shared by buildTo's replay and doStep).
  const appendStep = (t: TrainerState, n = 1): TrainerState => {
    const next = run(strategy.modelOf(t.result), t.result.step, n);
    const model = strategy.modelOf(next);
    return {
      result: next,
      history: [...t.history, { step: next.step, loss: strategy.loss(model, ordered) }],
      modelHistory: [...t.modelHistory, { step: next.step, model }],
    };
  };

  // Build a fresh run from the current seed and advance it to `targetStep`.
  // Re-inits pass 0; only the mount initializer replays the URL's step, so a
  // later seed/precision change resets to step 0 rather than the shared step.
  const buildTo = (targetStep: number): TrainerState => {
    const model = init(seed);
    let state: TrainerState = {
      result: run(model, 0, 0),
      history: [{ step: 0, loss: strategy.loss(model, ordered) }],
      modelHistory: [{ step: 0, model }],
    };
    for (let i = 0; i < targetStep; i++) state = appendStep(state);
    return state;
  };
  const [trainer, setTrainer] = useState<TrainerState>(() =>
    buildTo(Math.min(Math.max(initial?.step ?? 0, 0), MAX_REPLAY_STEPS)),
  );

  // Re-init when the seed, the example order (corpus identity or the shuffle
  // toggle), the strategy (e.g. the vector stage's tie-weights toggle), or the
  // display precision changes — compared during render (React's "adjusting
  // state when props change" pattern) rather than in an effect, so no frame
  // renders with the stale results. An lr change must *not* reset training, so
  // lr is deliberately not part of the key.
  const key = [seed, ordered, strategy, precision] as const;
  const [prevKey, setPrevKey] = useState<readonly unknown[]>(key);
  if (key.some((dep, i) => dep !== prevKey[i])) {
    setPrevKey(key);
    setTrainer(buildTo(0));
  }

  function doStep(n = 1) {
    setTrainer((t) => appendStep(t, n));
  }

  const reset = () => setTrainer(buildTo(0));

  return { ...trainer, seed, setSeed, lr, setLr, shuffle, setShuffle, doStep, reset };
}
