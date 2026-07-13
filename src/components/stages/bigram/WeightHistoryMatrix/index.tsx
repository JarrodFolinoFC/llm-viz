import { pairFlashStyles } from 'mlblocks';
import { color, useViewSettings } from '../../../../theme';
import { FormulaDisplay } from 'mlblocks';
import { Grid } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { PhaseTag } from 'mlblocks';
import { WeightSparkline } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';
import type { Matrix } from 'mlblocks/core';
import type { Pair } from 'mlblocks/core';
import type { ModelPoint } from 'mlblocks/react';

interface WeightHistoryMatrixProps {
  vocab: readonly string[];
  /** W snapshot at step 0 and after every trainer step (from `modelHistory`). */
  history: ModelPoint<Matrix>[];
  /** The shared |y| domain: max |w| across the whole history (view-model computed). */
  domainMax: number;
  step: number;
  flash?: Pair | null;
}

/**
 * The per-weight timeline companion to {@link WeightMatrix}: the same V×V
 * layout, but each cell is a tiny filled line chart of that weight over the
 * recorded steps. All 64 charts share one |y| domain (the max |w| across the
 * whole history) so magnitudes stay comparable across cells.
 */
export function WeightHistoryMatrix({ vocab, history, domainMax, step, flash }: WeightHistoryMatrixProps) {
  const { precision } = useViewSettings();
  const { aHead, bHead } = pairFlashStyles(flash);

  const steps = history.map((p) => p.step);
  const latest = history[history.length - 1].model;

  const title = (
    <span className={titleStyles.title}>
      <FormulaDisplay inline latex="W" />
      <PhaseTag phase="over steps" parens />
    </span>
  );

  return (
    <Panel
      title={title}
      stage={TrainingStage.Parameters}
      step={step}
      // Through step 1 the timelines are still flat lines at the random init —
      // purple dot, matching the weight matrix's convention.
      randomInit={step <= 1}
      dimmed={false}
    >
      <Grid
        columnHeaders={[...vocab]}
        rowHeadings={[...vocab]}
        cells={vocab.map((a, i) =>
          vocab.map((b, j) => (
            <WeightSparkline
              steps={steps}
              values={history.map((p) => p.model[i][j])}
              maxAbs={domainMax}
              label={`W[${a}][${b}] over ${steps[steps.length - 1]} steps, now ${latest[i][j].toFixed(precision)}`}
            />
          )),
        )}
        columnHeaderStyle={(j) => ({ textAlign: 'center', color: color.text.primary, ...bHead(j) })}
        rowHeadingStyle={(i) => ({ textAlign: 'right', ...aHead(i) })}
      />
    </Panel>
  );
}
