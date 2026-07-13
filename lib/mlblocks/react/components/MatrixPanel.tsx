import type { ReactNode } from 'react';

import { cssVar } from '../lib/cssVars';
import { signedColormap } from '../../core/colormaps';
import { maxAbs } from '../../core/math/funcs';
import { Grid } from './Grid';
import { StackedCell } from './StackedCell';
import { NumericCell } from './NumericCell';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';
import { JsRowButton } from './JsRowButton';
import { normLiteralSnippet } from '../lib/snippets';

interface MatrixPanelProps {
  /** LaTeX symbol shown in the title (e.g. "W_1", "\\nabla W_2"). */
  symbol: string;
  /** Context-token chip after the symbol (see {@link SymbolTitle.tokenChip}). */
  tokenChip?: string;
  /** Muted suffix after the symbol (e.g. "before step", "d×H"). */
  phase?: string;
  /** Which training phase this matrix belongs to — Weights, Backprop (∇W), or Update.
   *  In a flow this is injected from the `panel(stage, …)` node; pass it directly
   *  when rendering the panel on its own. */
  stage?: TrainingStage;
  matrix: number[][];
  step: number;
  dimmed?: boolean;
  /** The values shown are still the untouched random init (purple badge dot). */
  randomInit?: boolean;
  rowHeadings?: ReactNode[];
  columnHeaders?: ReactNode[];
  /**
   * Optional per-cell deltas. When present each cell shows the change above the
   * value (the "W ← W − η·grad" update view).
   */
  deltas?: number[][] | null;
  /**
   * Reserve a fixed width for the row-heading column (any CSS length). Use when
   * the labels vary in length between renders (e.g. the W₁ slot labels change
   * with the context) so a longer label can't push the matrix wider.
   */
  rowHeadingMinWidth?: number | string;
  /** Row indices to emphasise (amber heading, like EmbeddingMatrix's context
   *  rows) — e.g. the live context rows of the W₁ every-word view. */
  highlightedRows?: number[];
}

/**
 * A weight matrix as a signed heatmap of numeric cells, with optional row/column
 * labels and an optional per-cell delta overlay. Reused for every 2-D quantity
 * in the MLP flow — W₁, W₂, their gradients, and their post-update values.
 */
export function MatrixPanel({
  symbol,
  tokenChip,
  phase,
  stage,
  matrix,
  step,
  dimmed = false,
  randomInit,
  rowHeadings,
  columnHeaders,
  deltas,
  rowHeadingMinWidth,
  highlightedRows,
}: MatrixPanelProps) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const tint = signedColormap(maxAbs(matrix.length ? matrix : [[0]]));
  const headings = rowHeadings ?? Array.from({ length: rows }, (_, i) => i);
  const headers = columnHeaders ?? Array.from({ length: cols }, (_, j) => j);
  const marked = new Set(highlightedRows);
  // Same warm-amber convention as EmbeddingMatrix's context rows; the cells keep
  // their heatmap tint, so the emphasis lives on the heading.
  const markHeadingStyle = (i: number) =>
    marked.has(i)
      ? { background: cssVar.chipPrevBg, color: cssVar.chipPrevFg, fontWeight: 600 as const }
      : undefined;

  return (
    <Panel
      title={<SymbolTitle symbol={symbol} tokenChip={tokenChip} phase={phase} />}
      stage={stage}
      step={step}
      dimmed={dimmed}
      randomInit={randomInit}
    >
      <Grid
        columnHeaders={headers}
        rowHeadings={headings}
        cells={matrix.map((row, i) =>
          row.map((v, j) =>
            deltas ? (
              <StackedCell
                annotations={[<NumericCell value={deltas[i][j]} signed prefix="Δ" />]}
                main={<NumericCell value={v} signed />}
              />
            ) : (
              <NumericCell value={v} signed />
            )
          )
        )}
        cellStyle={(i, j) => ({ background: tint(matrix[i][j], i, j) })}
        rowHeadingStyle={(i) => ({ textAlign: 'right', minWidth: rowHeadingMinWidth, whiteSpace: 'nowrap', ...markHeadingStyle(i) })}
        columnHeaderStyle={() => ({ textAlign: 'right', color: cssVar.textSecondary })}
        rowAction={(i) => <JsRowButton snippet={normLiteralSnippet(matrix[i])} label={`‖row ${i}‖`} />}
      />
    </Panel>
  );
}
