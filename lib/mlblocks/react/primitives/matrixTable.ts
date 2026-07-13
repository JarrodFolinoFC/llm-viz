import type { CSSProperties, ReactNode } from 'react';

/**
 * The render plan the headless {@link Grid} hands to the renderer's
 * MatrixTable primitive: pure data — content and per-cell styles — that the
 * renderer translates into its platform's table layout.
 *
 * Cell `style` is a React style object today (heatmap backgrounds, flash
 * highlights — data-driven values, not theme). When the data panels migrate
 * (wave C5) these narrow to token styles; the plan shape won't change.
 */

export interface MatrixPlanCell {
  content: ReactNode;
  style?: CSSProperties;
}

export interface MatrixPlanRow {
  heading: { content: ReactNode; style?: CSSProperties };
  cells: MatrixPlanCell[];
  /** Optional trailing action for this row (e.g. a "JS" console button). */
  action?: ReactNode;
  /** Bold — tracks the active token. */
  highlighted?: boolean;
  /** Row activates (pointer + keyboard) and reports its index. */
  clickable?: boolean;
}

export interface GridRenderPlan {
  /** Header cells, one per column (heading column excluded). */
  head: MatrixPlanCell[];
  rows: MatrixPlanRow[];
  /** Summary (rollup) rows beneath the body. */
  summaries: { label: ReactNode; cells: MatrixPlanCell[] }[];
  /** Whether an action column exists (keeps header/summary widths aligned). */
  hasAction: boolean;
}

export interface MatrixTableProps {
  plan: GridRenderPlan;
  /** Row activation (pointer + keyboard) — the renderer wires its platform's events. */
  onRowPress?: (i: number) => void;
}
