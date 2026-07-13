import { TrainingStage } from '../../core/stage';

/**
 * Derive a {@link DialsNote} binding from an existing panel's binding — so any
 * matrix/vector panel gets a dials companion with no separate authoring. Reads
 * the standard shape the matrix/vector components already produce: `matrix`
 * (grid of dials) or `values` (row of gauges), plus `symbol`, `step`, `dimmed`
 * and the row/column headings. A single-column matrix collapses to a gauge row.
 */
const label = (x: unknown, i: number) => (typeof x === 'string' || typeof x === 'number' ? String(x) : `${i}`);

export function dialsBind<V>(bind: (v: V) => unknown, stage: TrainingStage, symbol?: string) {
  return (v: V) => {
    const p = bind(v) as Record<string, unknown>;
    let matrix = p.matrix as number[][] | undefined;
    let vector = (p.values ?? p.vector) as number[] | undefined;
    if (matrix && (matrix[0]?.length ?? 0) === 1) {
      vector = matrix.map((r) => r[0] ?? 0);
      matrix = undefined;
    }
    return {
      symbol: symbol ?? (p.symbol as string) ?? '',
      stage,
      step: (p.step as number) ?? 0,
      dimmed: p.dimmed as boolean | undefined,
      matrix,
      vector,
      rowLabels: (p.rowHeadings as unknown[] | undefined)?.map(label) ?? (p.vocab as string[] | undefined),
      colLabels: (p.columnHeaders as unknown[] | undefined)?.map(label),
    };
  };
}
