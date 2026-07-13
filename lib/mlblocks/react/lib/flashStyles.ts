import { cssVar } from './cssVars';

export type HeaderHighlight = { row: number; target: number };

/** {@link flashStyles} for the pair-shaped flashes the trainers emit
 *  ({ prev, target }): prev is the trained row, and no flash means no styles. */
export function pairFlashStyles(flash: { prev: number; target: number } | null | undefined) {
  return flashStyles(flash ? { row: flash.prev, target: flash.target } : null);
}

export function flashStyles(flash: HeaderHighlight | null) {
  return {
    // Trained row's label ("a" = prev): the prev token-chip highlight while flashed.
    aHead: (i: number) =>
      flash?.row === i
        ? { background: cssVar.chipPrevBg, color: cssVar.chipPrevFg, fontWeight: 'bold' as const }
        : null,
    // Target column's label ("b" = next): the target token-chip highlight while flashed.
    bHead: (j: number) =>
      flash?.target === j
        ? { background: cssVar.chipNextBg, color: cssVar.chipNextFg, fontWeight: 'bold' as const }
        : null,
  };
}
