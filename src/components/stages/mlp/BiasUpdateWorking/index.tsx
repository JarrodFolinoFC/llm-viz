import type { ReactNode } from 'react';

import { color } from '../../../../theme';
import { signedColormap } from 'mlblocks/core';
import { maxAbs } from 'mlblocks/core';
import { Grid } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { SymbolTitle } from 'mlblocks';

/** One column of the gradient build-up (e.g. p, y, then p − y). The last one is
 *  the gradient ∇b itself; `muted` greys the intermediate factors. */
export interface DecompColumn {
  label: ReactNode;
  values: number[];
  muted?: boolean;
}

interface BiasUpdateWorkingProps {
  /** LaTeX title, e.g. "\\Delta b_1 = -\\eta\\,\\nabla b_1". */
  title: string;
  rowLabels: ReactNode[];
  /** The gradient, built up left-to-right (last column = ∇b). */
  decomposition: DecompColumn[];
  /** Per-element update Δb = −η·∇b. */
  deltas: number[];
  /** The bias before and after the step. */
  before: number[];
  after: number[];
  lr: number;
  step: number;
  dimmed?: boolean;
}

/**
 * A bias update worked out one unit per row: the gradient (built up across the
 * decomposition columns — e.g. `p`, `y`, `p − y` for b₂, or just `∇z₁` for b₁,
 * since `∇b = ∇z₁`), then `Δb = −η·∇b`, then `b before` and `b + Δb = b after`
 * side by side — the whole SGD step for the bias in one line.
 */
export function BiasUpdateWorking({
  title,
  rowLabels,
  decomposition,
  deltas,
  before,
  after,
  lr,
  step,
  dimmed = false,
}: BiasUpdateWorkingProps) {
  const n = rowLabels.length;

  const gradTint = signedColormap(maxAbs(decomposition.map((c) => c.values)));

  const columns: { label: ReactNode; cell: (i: number) => ReactNode; tint?: (i: number) => string | undefined }[] = [
    ...decomposition.map((c) => ({
      label: c.label,
      cell: (i: number) => (
        <NumericCell value={c.values[i] ?? 0} signed colorFn={c.muted ? () => color.text.secondary : undefined} />
      ),
      tint: (i: number) => (c.muted ? undefined : gradTint(c.values[i] ?? 0, i, 0)),
    })),
    {
      label: <SymbolTitle symbol="\Delta b" phase={`−η, η=${lr.toFixed(2)}`} />,
      cell: (i: number) => <NumericCell value={deltas[i] ?? 0} signed prefix="Δ" colorFn={() => color.text.emphasis} />,
    },
    { label: <SymbolTitle symbol="b" phase="before" />, cell: (i: number) => <NumericCell value={before[i] ?? 0} signed colorFn={() => color.text.secondary} /> },
    { label: <SymbolTitle symbol="b" phase="after" />, cell: (i: number) => <NumericCell value={after[i] ?? 0} signed /> },
  ];

  return (
    <Panel
      title={<SymbolTitle symbol={title} phase="worked out" />}
      stage={TrainingStage.Update}
      step={step}
      dimmed={dimmed}
    >
      <Grid
        columnHeaders={columns.map((c) => c.label)}
        rowHeadings={rowLabels}
        cells={Array.from({ length: n }, (_, i) => columns.map((c) => c.cell(i)))}
        cellStyle={(i, j) => {
          const bg = columns[j].tint?.(i);
          return bg ? { background: bg } : undefined;
        }}
        rowHeadingStyle={() => ({ textAlign: 'right' })}
        columnHeaderStyle={() => ({ textAlign: 'right', color: color.text.secondary })}
      />
    </Panel>
  );
}
