import { type ReactNode } from 'react';

import { FloatingDock } from '../FloatingDock';
import { TrainingLoss, type LossMetric } from '../../../react/components/TrainingLoss';
import { LossSlotProvider } from '../../../react/flow/lossSlot';
import type { StepTrainerController } from '../../../react/useStepTrainer';
import type { LossFloors } from '../../../core/engine/corpusStats';
import type { Pair } from '../../../core/engine/stepTrainer';

/** One parameter tensor's shape, for the live parameter-count metric. */
export interface ParamSpec {
  /** Display name (e.g. "W₁", "E", "b₂"). */
  label: string;
  /** Dimensions — [rows, cols] for a matrix, [n] for a vector. */
  dims: number[];
}

const paramCount = (p: ParamSpec) => p.dims.reduce((a, b) => a * b, 1);

/** The parameter-accounting metric: total count with the per-tensor breakdown
 *  in the tooltip — the toy-scale version of nanoGPT's "number of parameters"
 *  startup line. */
function paramsMetric(params: ParamSpec[]): LossMetric {
  const total = params.reduce((s, p) => s + paramCount(p), 0);
  const breakdown = params
    .map((p) => `${p.label} ${p.dims.join('×')} = ${paramCount(p)}`)
    .join(' · ');
  return {
    label: 'parameters',
    value: total.toLocaleString(),
    explain: `Total learnable parameters: ${breakdown}. Every one of these numbers moves on every relevant step. nanoGPT prints this same accounting on startup (~124M for GPT-2) — being able to audit it starts here.`,
  };
}

interface StageShellProps<
  TResult extends { step: number; currentLoss: number; prevProbs: number[]; currentPair: Pair },
> {
  /** The shared training controller from useStepTrainer. */
  controller: StepTrainerController<TResult>;
  /** Live model variables for the math console (E, U, a, b, …). */
  scope: Record<string, unknown>;
  vocab: readonly string[];
  /** Number of training examples (drives the dock's epoch progress). */
  examplesLength: number;
  /** Mean cross-entropy over the whole corpus; perplexity is derived as its exp. */
  meanLoss: number;
  /** The stage's self-describing headline error metric. */
  metric: LossMetric;
  /** The corpus's irreducible loss floors (conditional entropy etc.). */
  floors?: LossFloors;
  /** The stage's parameter tensors, for the live parameter-count metric. */
  params?: ParamSpec[];
  /** Stage-specific training controls, shown in the dock's trainer panel. */
  trainerExtras?: ReactNode;
  /** The stage's flow (the panels). */
  children: ReactNode;
}

/**
 * The shared scaffold every stage container ends with: the floating dock
 * (training controls + math console) wired to the trainer controller, and the
 * training-loss readout. Each container only computes its `view`, `scope`,
 * `meanLoss`, `metric`, `floors` and `params`; this owns the identical wiring
 * (including perplexity = exp(meanLoss), the before→after step loss, and the
 * ln(V) random baseline) so it lives in exactly one place.
 *
 * The loss panel itself is handed to the flow via {@link LossSlotProvider} so the
 * renderer drops it in as the pipeline's bottom "Loss" stage (filterable in the
 * StageSelect) rather than a fixed readout pinned above the flow.
 */
export function StageShell<
  TResult extends { step: number; currentLoss: number; prevProbs: number[]; currentPair: Pair },
>({
  controller,
  scope,
  vocab,
  examplesLength,
  meanLoss,
  metric,
  floors,
  params,
  trainerExtras,
  children,
}: StageShellProps<TResult>) {
  const { result, history, seed, setSeed, lr, setLr, shuffle, setShuffle, doStep, reset } = controller;
  const { step, currentLoss } = result;

  // The worked example replays the pre-update forward pass; −log of its
  // p(target) is the trained pair's loss BEFORE this step's update.
  const stepLossBefore = -Math.log(Math.max(result.prevProbs[result.currentPair.target], 1e-12));

  const loss = (
    <TrainingLoss
      meanLoss={meanLoss}
      perplexity={Math.exp(meanLoss)}
      stepLoss={currentLoss}
      stepLossBefore={stepLossBefore}
      metric={metric}
      extraMetrics={params ? [paramsMetric(params)] : undefined}
      history={history}
      step={step}
      floor={floors?.minCrossEntropy}
      baseline={Math.log(vocab.length)}
      epochLen={examplesLength}
    />
  );

  return (
    <FloatingDock
      seed={seed}
      onSeedChange={setSeed}
      lr={lr}
      onLrChange={setLr}
      shuffle={shuffle}
      onShuffleChange={setShuffle}
      extras={trainerExtras}
      examplesLength={examplesLength}
      step={step}
      onStep={doStep}
      onReset={reset}
      scope={scope}
      vocab={vocab}
    >
      <LossSlotProvider value={loss}>{children}</LossSlotProvider>
    </FloatingDock>
  );
}
