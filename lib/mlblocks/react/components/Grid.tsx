import type { CSSProperties, ReactNode } from 'react';

import { useP } from '../primitives/context';
import type { GridRenderPlan, MatrixPlanCell } from '../primitives/matrixTable';

export interface GridProps {
  /** Top header row, one entry per column. */
  columnHeaders: ReactNode[];
  /** Left heading per row (e.g. "hat", "the", …). */
  rowHeadings: ReactNode[];
  /** cells[row][col] — fully arbitrary content. Stack annotations on top of a
   *  main value with the {@link StackedCell} helper. */
  cells: ReactNode[][];
  /** Per-cell style hook — return any style (background, color, …). */
  cellStyle?: (i: number, j: number) => CSSProperties | undefined;
  /** Per-column-header style hook (e.g. flash-highlight the active column). */
  columnHeaderStyle?: (j: number) => CSSProperties | undefined;
  /** Per-row-heading style hook (e.g. right-align labels, flash the active row). */
  rowHeadingStyle?: (i: number) => CSSProperties | undefined;
  /** Bolds a single row to track the active token. */
  highlightedRow?: number;
  /** Optional summary row beneath the body, separated by a top border. */
  rollup?: { label: ReactNode; cells: ReactNode[] };
  /** Optional summary rows beneath the body, stacked one under another. */
  rollups?: { label: ReactNode; cells: ReactNode[] }[];
  /** Optional trailing action per body row (e.g. a "JS" console button). */
  rowAction?: (i: number) => ReactNode;
  /** When set, body rows become activatable and report their index. */
  onRowClick?: (i: number) => void;
}

/**
 * The headless matrix grid: computes a {@link GridRenderPlan} — content and
 * styles — and hands it to the renderer's MatrixTable, which owns the
 * platform's table layout and interaction affordances. Public props unchanged
 * from the pre-extraction Grid, so panel call sites don't move.
 */
export function Grid({
  columnHeaders,
  rowHeadings,
  cells,
  cellStyle,
  columnHeaderStyle,
  rowHeadingStyle,
  highlightedRow,
  rollup,
  rollups,
  rowAction,
  onRowClick,
}: GridProps) {
  const P = useP();
  const summaryRows = [...(rollup ? [rollup] : []), ...(rollups ?? [])];
  const summaryCell = (content: ReactNode): MatrixPlanCell => ({ content });

  const plan: GridRenderPlan = {
    head: columnHeaders.map((content, j) => ({
      content,
      style: columnHeaderStyle?.(j),
    })),
    rows: rowHeadings.map((heading, i) => ({
      heading: { content: heading, style: rowHeadingStyle?.(i) },
      cells: (cells[i] ?? []).map((content, j) => ({
        content,
        style: cellStyle?.(i, j),
      })),
      action: rowAction?.(i),
      highlighted: i === highlightedRow,
      clickable: !!onRowClick,
    })),
    summaries: summaryRows.map((summary) => ({
      label: summary.label,
      cells: summary.cells.map(summaryCell),
    })),
    hasAction: !!rowAction,
  };

  return <P.MatrixTable plan={plan} onRowPress={onRowClick} />;
}
