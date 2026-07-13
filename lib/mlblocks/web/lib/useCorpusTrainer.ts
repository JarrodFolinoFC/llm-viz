import { useMemo } from 'react';

import { lossFloors, type LossFloors } from '../../core';
import type { Example, FlashStep, StepCore, TrainerStrategy } from '../../core/engine/stepTrainer';
import type { Precision } from '../../core/precision';
import type { ModelPoint, StepTrainerController } from '../../react/useStepTrainer';
import { useViewSettings } from '../theme/ViewSettings';
import { useUrlSyncedStepTrainer } from './urlState';

/** What `prepare` must produce: the trainer's examples, plus any statics the
 *  view-model wants alongside them (empirical distribution, block size, …). */
export interface CorpusPrep<TExample> {
  examples: TExample[];
}

interface UseCorpusTrainerArgs<
  P extends CorpusPrep<TExample>,
  TModel,
  TExample extends Example,
  TFlash extends FlashStep,
  TResult extends StepCore<TFlash>,
  VM,
> {
  corpus: string;
  vocab: readonly string[];
  /** Slice the corpus into this model's training examples (+ derived statics).
   *  Memoised on corpus/vocab (+ `prepareDeps`); keep it pure. */
  prepare: (corpus: string, vocab: readonly string[]) => P;
  /** Extra `prepare` inputs beyond corpus/vocab (e.g. blockSize) — a change re-prepares. */
  prepareDeps?: readonly unknown[];
  /** Loss-floor context length: 1 for pair models, N for block models. */
  contextLen: number;
  /** The per-model algorithm. */
  strategy: TrainerStrategy<TModel, TExample, TFlash, TResult>;
  /** Build fresh weights for a seed. */
  init: (seed: number) => TModel;
  /** The page's default seed and learning rate. */
  defaults: { seed: number; lr: number };
  /** Build the per-step view-model from the prep + the trainer's live slice.
   *  Memoised on the DATA arguments only — the callback itself may be an
   *  inline closure over page config (vocab, dims, toggles that re-init the
   *  trainer); it is deliberately not a dependency. */
  viewModel: (args: {
    prep: P;
    result: TResult;
    lr: number;
    modelHistory: ModelPoint<TModel>[];
    precision: Precision;
  }) => VM;
}

/**
 * The whole training-stage assembly line, stated once: corpus → examples
 * (`prepare`) → the URL-synced step trainer → the per-step view-model — plus
 * the corpus-level loss floors the shell's chart draws. Everything upstream of
 * the StageShell markup, so a stage container reduces to its page config and
 * its layout.
 *
 * Run identity is exactly this hook's inputs: corpus, vocab, strategy, seed /
 * lr defaults (URL-overridable) and the ambient precision — matching the rule
 * that anything identity-shaped enters through a constructor, while
 * interaction state stays downstream in contexts.
 */
export function useCorpusTrainer<
  P extends CorpusPrep<TExample>,
  TModel,
  TExample extends Example,
  TFlash extends FlashStep,
  TResult extends StepCore<TFlash>,
  VM,
>(
  args: UseCorpusTrainerArgs<P, TModel, TExample, TFlash, TResult, VM>,
): { controller: StepTrainerController<TResult, TModel>; vm: VM; prep: P; floors: LossFloors } {
  const { corpus, vocab, contextLen, strategy, init, defaults } = args;
  const { precision } = useViewSettings();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- prepare is a render-stable closure; its real inputs are the deps below.
  const prep = useMemo(() => args.prepare(corpus, vocab), [corpus, vocab, ...(args.prepareDeps ?? [])]);
  const floors = useMemo(() => lossFloors(corpus, contextLen), [corpus, contextLen]);

  const controller = useUrlSyncedStepTrainer({ examples: prep.examples, strategy, init, defaults });

  const { result, lr, modelHistory } = controller;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- viewModel is a render-stable closure; its real inputs are the deps below.
  const vm = useMemo(
    () => args.viewModel({ prep, result, lr, modelHistory, precision }),
    [prep, result, lr, modelHistory, precision],
  );

  return { controller, vm, prep, floors };
}
