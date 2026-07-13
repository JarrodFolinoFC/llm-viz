import type { ReactNode } from 'react';

import { signedColormap } from '../../core/colormaps';
import { maxAbs } from '../../core/math/funcs';
import { Grid } from './Grid';
import { StackedCell } from './StackedCell';
import { NumericCell } from './NumericCell';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';

interface VectorPanelProps {
  /** LaTeX symbol shown in the title (e.g. "h", "x", "\\nabla z_1"). */
  symbol: string;
  /** Muted suffix after the symbol (e.g. "tanh(x·W₁+b₁)"). */
  phase?: string;
  /** Which training phase this vector belongs to — e.g. Forward (h, x) or Backprop (∇z₁).
   *  Injected from the `panel(stage, …)` node in a flow; pass directly when standalone. */
  stage?: TrainingStage;
  values: number[];
  step: number;
  dimmed?: boolean;
  /** Optional per-element labels (defaults to the element index). */
  rowHeadings?: ReactNode[];
  /**
   * Optional per-element deltas. When present each cell shows the change above
   * the value (the "b ← b − η·grad" update view), like MatrixPanel's deltas.
   */
  deltas?: number[] | null;
  /** Element to flash-highlight (e.g. the target slot of a gradient). */
  highlightedRow?: number | null;
  /**
   * Cap the card at its own content width instead of stretching to fill the grid
   * column. The bias vectors (b₁, b₂) are one narrow value column, but their
   * grid track is inflated by the wide spanning rows below; `compact` keeps them
   * as thin as their content.
   */
  compact?: boolean;
}

/**
 * A labelled numeric vector rendered as one value per row, each cell tinted by a
 * signed heatmap. The workhorse for every 1-D quantity in the MLP flow — the
 * concatenated input x, the hidden activations h, the logits, the biases, and
 * the backprop gradient vectors.
 */
export function VectorPanel({
  symbol,
  phase,
  stage,
  values,
  step,
  dimmed = false,
  rowHeadings,
  deltas,
  highlightedRow,
  compact,
}: VectorPanelProps) {
  const tint = signedColormap(maxAbs([values]));
  const headings = rowHeadings ?? values.map((_, i) => i);

  return (
    <Panel
      title={<SymbolTitle symbol={symbol} phase={phase} />}
      stage={stage}
      step={step}
      dimmed={dimmed}
      style={compact ? { maxWidth: 'max-content' } : undefined}
    >
      <Grid
        columnHeaders={[`value (${values.length})`]}
        rowHeadings={headings}
        cells={values.map((v, i) => [
          deltas ? (
            <StackedCell
              annotations={[<NumericCell value={deltas[i]} signed prefix="Δ" />]}
              main={<NumericCell value={v} signed />}
            />
          ) : (
            <NumericCell value={v} signed />
          ),
        ])}
        cellStyle={(i) => ({ background: tint(values[i], i, 0) })}
        rowHeadingStyle={() => ({ textAlign: 'right' })}
        highlightedRow={highlightedRow ?? undefined}
      />
    </Panel>
  );
}
