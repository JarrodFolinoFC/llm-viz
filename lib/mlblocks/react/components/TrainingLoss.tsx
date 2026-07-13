import { useState } from 'react';

import { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { useTrainerSettings } from '../settings';
import type { LossPoint } from '../useStepTrainer';
import { Panel } from './Panel';
import { Term } from './Term';

export type { LossPoint };

/**
 * A self-describing headline metric, supplied by each stage. Stages score
 * differently (bigram/vector: distance to the empirical distribution; MLP:
 * misclassified count), so the label, units and tooltip travel WITH the value
 * rather than being hard-coded here — otherwise one stage's number renders under
 * another stage's label.
 */
export interface LossMetric {
  label: string;
  /** Pre-formatted for display (the stage owns its units/precision). */
  value: string;
  explain: string;
  formula?: string;
}

/** Shared tooltip for the bigram/vector "dist. error" metric. */
export const DIST_ERROR_EXPLAIN =
  'Mean total-variation distance between each learned row softmax(W) and the empirical bigram distribution from the corpus counts. 0 means the model exactly matches the data statistics. At a small embedding width d the logit matrix E·Uᵀ is low-rank, so the vector stage may plateau above 0 — raise d to close the gap.';

interface TrainingLossProps {
  /** Mean cross-entropy (average negative log-likelihood) over the whole corpus. */
  meanLoss: number;
  /** exp(meanLoss). */
  perplexity: number;
  /** Cross-entropy of the trained pair AFTER its update. */
  stepLoss: number;
  /** Cross-entropy of the same pair BEFORE its update (the worked example's p). */
  stepLossBefore?: number;
  /** The stage's headline error metric (self-describing — see {@link LossMetric}). */
  metric: LossMetric;
  /** Extra self-describing metrics (e.g. the parameter count). */
  extraMetrics?: LossMetric[];
  history: LossPoint[];
  step: number;
  /** Irreducible corpus cross-entropy (conditional entropy) — the chart's floor line. */
  floor?: number;
  /** Untrained/random-guessing cross-entropy ln(V) — the chart's ceiling reference. */
  baseline?: number;
  /** Examples per epoch — draws a faint marker at each epoch boundary. */
  epochLen?: number;
}

function Metric({ label, value, explain, formula }: { label: string; value: string; explain: string; formula?: string }) {
  const P = useP();
  return (
    <P.View direction="col" gap="xs">
      <P.Text sty={{ font: 'sm', color: 'textSecondary' }}>
        <Term label={label} explain={explain} formula={formula} />
      </P.Text>
      <P.Text sty={{ fontRem: 1.4, tabular: true, color: 'text' }}>{value}</P.Text>
    </P.View>
  );
}

export function TrainingLoss({
  meanLoss,
  perplexity,
  stepLoss,
  stepLossBefore,
  metric,
  extraMetrics,
  history,
  step,
  floor,
  baseline,
  epochLen,
}: TrainingLossProps) {
  const P = useP();
  const { precision } = useTrainerSettings();
  const [logScale, setLogScale] = useState(false);
  // The worked example replays the pre-update forward pass, so its p(target)
  // implies the BEFORE loss; showing before → after keeps the two panels
  // derivable from each other (and shows the update helped).
  const stepValue =
    step === 0
      ? '—'
      : stepLossBefore != null
        ? `${stepLossBefore.toFixed(precision)} → ${stepLoss.toFixed(precision)}`
        : stepLoss.toFixed(precision);
  const floorNote =
    floor != null && floor > 0
      ? ` The corpus is ambiguous (one context, several next tokens), so the floor is ${floor.toFixed(precision)} — the curve converges there, not to 0.`
      : '';

  return (
    <Panel
      title="Training loss"
      stage={TrainingStage.Loss}
      step={step}
      dimmed={false}
      style={{ marginBottom: 16, maxWidth: 'fit-content' }}
    >
      <P.View gap="lg" align="end" wrap>
        <Metric
          label="cross-entropy"
          value={meanLoss.toFixed(precision)}
          explain={`Mean negative log-likelihood the model assigns to the actual next token, averaged over every training pair. This is the quantity SGD is minimizing — watch it fall as you step.${floorNote}`}
          formula="\mathcal{L} = -\frac{1}{N}\sum_{n} \log p(\text{target}_n)"
        />
        <Metric
          label="perplexity"
          value={perplexity.toFixed(precision)}
          explain={`exp(cross-entropy): roughly 'how many tokens the model is choosing between' on average. Vocab-size is random guessing.${
            floor != null && floor > 0
              ? ` The best reachable perplexity here is ${Math.exp(floor).toFixed(precision)}, not 1.0 — the corpus itself is ambiguous.`
              : ' 1.0 would be a corpus with no ambiguity.'
          }`}
          formula="\text{ppl} = e^{\mathcal{L}}"
        />
        <Metric
          label="this step"
          value={stepValue}
          explain="Cross-entropy of the single (context → next-token) pair trained on this step, before → after its update. Before is −log p(target) from the worked-example softmax; after re-runs the same pair on the updated weights, so the drop is the update working. Noisier than the corpus mean — that's online SGD."
        />
        <Metric label={metric.label} value={metric.value} explain={metric.explain} formula={metric.formula} />
        {extraMetrics?.map((m) => (
          <Metric key={m.label} label={m.label} value={m.value} explain={m.explain} formula={m.formula} />
        ))}
        <P.View direction="col" gap="xs">
          {history.length < 2 ? (
            <P.Text sty={{ color: 'textMuted', font: 'sm' }}>step to plot the loss curve…</P.Text>
          ) : (
            <>
              <P.LossChart
                history={history}
                floor={floor}
                baseline={baseline}
                epochLen={epochLen}
                logScale={logScale}
                precision={precision}
              />
              <P.Checkbox checked={logScale} onChange={setLogScale}>
                <P.Text sty={{ font: 'sm', color: 'textSecondary' }}>log y</P.Text>
              </P.Checkbox>
            </>
          )}
        </P.View>
      </P.View>
    </Panel>
  );
}
