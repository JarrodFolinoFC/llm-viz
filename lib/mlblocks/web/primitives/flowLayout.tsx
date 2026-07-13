import clsx from 'clsx';

import type { FlowLayoutProps, FlowSurfaceProps, TrackGridProps } from '../../react/primitives/types';
import { resolveSpace } from './resolveSty';
import styles from './flow.module.css';

/** The arrangement-keyed wrapper every flow renders inside — the CSS reflows
 *  rows/grids off the data attribute so one setting drives every flow. */
export function FlowSurface({ arrangement, children }: FlowSurfaceProps) {
  return (
    <div className={styles.arrange} data-arrangement={arrangement}>
      {children}
    </div>
  );
}

const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const;
const JUSTIFY = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' } as const;

/** A flow row / grouped column. `flowRow` rows are the reflow unit: the
 *  arrangement CSS collapses or dissolves them; grouped columns keep shape. */
export function FlowLayout({ direction, gap, wrap, align, justify, flowRow, className, children }: FlowLayoutProps) {
  return (
    <div
      className={clsx(direction === 'col' ? styles.flowCol : styles.flowRow, flowRow && styles.stageRow, className)}
      style={{
        ...(gap !== undefined ? { gap: resolveSpace(gap) } : {}),
        ...(wrap ? { flexWrap: 'wrap' } : {}),
        ...(align ? { alignItems: ALIGN[align] } : {}),
        ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
      }}
    >
      {children}
    </div>
  );
}

/** The shared-track grid: every non-span row's i-th cell shares the i-th
 *  `max-content` column track, so cells column-align across rows. */
export function TrackGrid({ nCols, rowGap, columnGap, rows }: TrackGridProps) {
  return (
    <div
      className={styles.flowGrid}
      style={{ gridTemplateColumns: `repeat(${nCols}, max-content)`, rowGap, columnGap }}
    >
      {rows.flatMap((row, ri) =>
        row.span ? (
          <div key={`r${ri}`} className={styles.gridSpan}>
            {row.cells.map((c, i) => (
              <span key={i}>{c.content}</span>
            ))}
          </div>
        ) : (
          row.cells.map((c, i) => (
            // `grid-column-start: 1` on a row's first cell forces auto-flow
            // onto a fresh grid row, even when the row has fewer cells than
            // there are tracks.
            <div
              key={`r${ri}c${i}`}
              className={c.arrow ? styles.gridArrowCell : undefined}
              style={i === 0 ? { gridColumnStart: 1 } : undefined}
            >
              {c.content}
            </div>
          ))
        ),
      )}
    </div>
  );
}

/** The web flow class map — exported so tests/tooling can assert against the
 *  renderer's layout classes without duplicating them. */
export const flowClasses = styles;
