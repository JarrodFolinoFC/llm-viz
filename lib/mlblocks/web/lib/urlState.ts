import { useCallback, useEffect, useMemo } from 'react';

import { PRECISION, PRECISIONS, type Precision } from '../../core/precision';
import { TrainingStage } from '../../core/stage';
import type { Example, FlashStep, StepCore, TrainerStrategy } from '../../core/engine/stepTrainer';
import { useStepTrainer, type StepTrainerController } from '../../react/useStepTrainer';
import { useViewSettings } from '../theme/ViewSettings';

/**
 * The bookmarkable per-page state for the training pages, encoded in the query
 * string so a URL reproduces a run: the trainer inputs (`seed`, `lr`, `shuffle`,
 * `step`), the global decimal `precision`, and the per-page stage filter
 * (`hide`). Every field is optional — an absent param means "use the page
 * default", and writers omit any value that equals its default so URLs stay
 * clean (see {@link useUrlPatch}). `step` is the number of SGD updates to replay
 * on load; because the trainer is deterministic in seed/order/lr, replaying it
 * lands on the exact same model.
 */
export interface TrainerUrlState {
  seed?: number;
  lr?: number;
  shuffle?: boolean;
  step?: number;
  precision?: Precision;
  hide?: TrainingStage[];
}

const STAGE_VALUES = new Set<string>(Object.values(TrainingStage));

const parseInt10 = (raw: string | null): number | undefined => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
};

const parseFloat10 = (raw: string | null): number | undefined => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Read the training-page state out of a query string (unknown/garbage params ignored). */
export function parseTrainerUrl(params: URLSearchParams): TrainerUrlState {
  const out: TrainerUrlState = {};

  const seed = parseInt10(params.get('seed'));
  if (seed !== undefined) out.seed = seed;

  const lr = parseFloat10(params.get('lr'));
  if (lr !== undefined && lr > 0) out.lr = lr;

  const step = parseInt10(params.get('step'));
  if (step !== undefined && step >= 0) out.step = step;

  const shuffle = params.get('shuffle');
  if (shuffle === '1') out.shuffle = true;
  else if (shuffle === '0') out.shuffle = false;

  const p = parseInt10(params.get('p'));
  if (p !== undefined && (PRECISIONS as number[]).includes(p)) out.precision = p as Precision;

  const hide = params.get('hide');
  if (hide) {
    const stages = hide.split(',').filter((s) => STAGE_VALUES.has(s)) as TrainingStage[];
    if (stages.length) out.hide = stages;
  }

  return out;
}

/** Format a number for the URL without trailing-zero noise (0.30 → "0.3"). */
export const numParam = (n: number): string => String(Number(n.toPrecision(6)));

/**
 * Merge a set of query params into the current URL, removing any whose value is
 * `null` (the writer's signal for "this equals its default — drop it"). Writes
 * with `history.replaceState` so live state changes update the address bar
 * without piling up browser-history entries.
 *
 * Deliberately bypasses react-router (raw `window.location` + `replaceState`)
 * rather than `useSearchParams`: the query is a one-way mirror of state that's
 * parsed once on mount, so the router needn't re-render on it — and this keeps
 * the writers usable in Storybook/jsdom, which render these panels without a
 * Router. Reading the live URL on every call also means multiple writers (the
 * trainer + the stage filter) merge safely without a stale snapshot clobbering
 * each other's keys. `history.state` is preserved so the router's own nav state
 * survives the rewrite.
 */
export function useUrlPatch(): (patch: Record<string, string | null>) => void {
  return useCallback((patch: Record<string, string | null>) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;
    for (const [k, v] of Object.entries(patch)) {
      const cur = url.searchParams.get(k);
      if (v === null || v === '') {
        if (cur !== null) {
          url.searchParams.delete(k);
          changed = true;
        }
      } else if (cur !== v) {
        url.searchParams.set(k, v);
        changed = true;
      }
    }
    if (changed) window.history.replaceState(window.history.state, '', url);
  }, []);
}

/** The trainer's slice of the URL — the mount overrides and the live snapshot.
 *  `precision` is global (owned by ViewSettings) but written here so a training
 *  page has a single URL writer — no cross-writer race over the query string. */
export type TrainerSlice = { seed: number; lr: number; shuffle: boolean; step: number; precision: Precision };

/**
 * Binds the trainer's URL slice for a container: parses the mount overrides once
 * (later address-bar edits must not yank a run mid-training), and returns a
 * `syncTrainer` that writes the live snapshot back — omitting any value equal to
 * the page default so the URL stays clean. Containers don't call this directly —
 * {@link useUrlSyncedStepTrainer} pairs it with `useStepTrainer` so the defaults
 * are stated once for both.
 */
export function useTrainerUrlBinding(defaults: { seed: number; lr: number }): {
  initial: { seed?: number; lr?: number; shuffle?: boolean; step?: number };
  syncTrainer: (snapshot: TrainerSlice) => void;
} {
  const patch = useUrlPatch();

  // Parse only on first mount: the URL is the seed for the run, not a live input.
  const initial = useMemo(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const { seed, lr, shuffle, step } = parseTrainerUrl(params);
    return { seed, lr, shuffle, step };
  }, []);

  const { seed: seed0, lr: lr0 } = defaults;
  const syncTrainer = useCallback(
    (s: TrainerSlice) =>
      patch({
        seed: s.seed === seed0 ? null : String(s.seed),
        lr: s.lr === lr0 ? null : numParam(s.lr),
        shuffle: s.shuffle ? '1' : null,
        step: s.step > 0 ? String(s.step) : null,
        p: s.precision === PRECISION ? null : String(s.precision),
      }),
    [patch, seed0, lr0],
  );

  return { initial, syncTrainer };
}

/**
 * A URL-synced {@link useStepTrainer} — the composition every stage container
 * uses. States the page's `seed`/`lr` defaults exactly once: they seed the
 * trainer *and* set the URL's "omit when equal" baseline (via
 * {@link useTrainerUrlBinding}), so the two can't silently diverge and a reload
 * always restores the run the address bar shows. Also mirrors the live trainer
 * state back into the query string; the global `precision` is read here — the
 * one settings read on the trainer path — both to mirror it into the URL (a
 * training page keeps a single URL writer, see {@link TrainerSlice}) and to
 * construct the trainer with it, since precision is part of a run's identity.
 */
export function useUrlSyncedStepTrainer<TModel, TExample extends Example, TFlash extends FlashStep, TResult extends StepCore<TFlash>>(args: {
  /** The corpus examples (memoised by the caller; its identity drives re-init). */
  examples: TExample[];
  /** The per-model algorithm. */
  strategy: TrainerStrategy<TModel, TExample, TFlash, TResult>;
  /** Build fresh weights for a seed. */
  init: (seed: number) => TModel;
  /** The page's default seed and learning rate. */
  defaults: { seed: number; lr: number };
}): StepTrainerController<TResult, TModel> {
  const { examples, strategy, init, defaults } = args;
  const { precision } = useViewSettings();
  const { initial, syncTrainer } = useTrainerUrlBinding(defaults);
  const controller = useStepTrainer({ examples, strategy, init, seed0: defaults.seed, lr0: defaults.lr, initial, precision });

  // Mirror the live trainer state into the query string.
  const { seed, lr, shuffle, result } = controller;
  useEffect(() => {
    syncTrainer({ seed, lr, shuffle, step: result.step, precision });
  }, [seed, lr, shuffle, result.step, precision, syncTrainer]);

  return controller;
}
