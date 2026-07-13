import type { ReactNode } from 'react';

import { color } from '../../../../theme';
import { signedColormap } from 'mlblocks/core';
import { maxAbs } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import { Grid, StackedCell } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { SymbolTitle } from 'mlblocks';

interface WeightUpdateWorkingProps {
  /** LaTeX for the gradient title, e.g. "\\nabla W_1 = x \\otimes \\nabla z_1". */
  title: string;
  /** Row factor `a` — one per matrix row (x for W₁, h for W₂). */
  rowFactor: number[];
  rowLabels: ReactNode[];
  /** Column factor `g` — one per matrix column (∇z₁ for W₁, p−y for W₂). */
  colFactor: number[];
  colLabels: ReactNode[];
  /** Per-cell update ΔW = −η·∇W (shown as each cell's annotation). */
  deltas: Matrix;
  lr: number;
  step: number;
  dimmed?: boolean;
  rowHeadingMinWidth?: number | string;
}

/**
 * A weight-matrix update worked out as the outer product that forms its
 * gradient: `∇W[i,j] = a[i]·g[j]`, with the two factor vectors on the margins
 * (`a[i]` beside each row, `g[j]` above each column) and their product — the
 * gradient itself — in the cell, the update `ΔW = −η·∇W` stacked above it.
 *
 * So a cell reads as "row factor × column factor = ∇W, ×(−η) = Δ" — the missing
 * middle of the pipeline between the two gradient vectors and the `W after`
 * panel.
 */
export function WeightUpdateWorking({
  title,
  rowFactor,
  rowLabels,
  colFactor,
  colLabels,
  deltas,
  lr,
  step,
  dimmed = false,
  rowHeadingMinWidth,
}: WeightUpdateWorkingProps) {
  const rows = rowFactor.length;
  const cols = colFactor.length;
  const grad = rowFactor.map((a) => colFactor.map((g) => a * g));
  const tint = signedColormap(maxAbs(grad.length ? grad : [[0]]));

  return (
    <Panel
      title={<SymbolTitle symbol={title} phase={`ΔW = −η·∇W, η=${lr.toFixed(2)}`} />}
      stage={TrainingStage.Update}
      step={step}
      dimmed={dimmed}
    >
      <Grid
        columnHeaders={Array.from({ length: cols }, (_, j) => (
          <StackedCell annotations={[colLabels[j]]} main={<NumericCell value={colFactor[j]} signed />} />
        ))}
        rowHeadings={Array.from({ length: rows }, (_, i) => (
          <StackedCell annotations={[rowLabels[i]]} main={<NumericCell value={rowFactor[i]} signed />} />
        ))}
        cells={grad.map((row, i) =>
          row.map((g, j) => (
            <StackedCell
              annotations={[<NumericCell value={deltas[i]?.[j] ?? 0} signed prefix="Δ" />]}
              main={<NumericCell value={g} signed />}
            />
          )),
        )}
        cellStyle={(i, j) => ({ background: tint(grad[i][j], i, j) })}
        rowHeadingStyle={() => ({ textAlign: 'right', minWidth: rowHeadingMinWidth, whiteSpace: 'nowrap' })}
        columnHeaderStyle={() => ({ textAlign: 'right', color: color.text.secondary })}
      />
    </Panel>
  );
}
