import clsx from 'clsx';

import type { MatrixTableProps } from '../../react/primitives/matrixTable';
import styles from './MatrixTable.module.css';

/** The web table's class map — exported so tests/tooling can assert against
 *  the renderer's classes (rowHighlighted, …) without duplicating them. */
export const matrixTableClasses = styles;

/**
 * The web MatrixTable: renders the headless Grid's plan as the same `<table>`
 * the pre-extraction Grid produced — CSS module and all. This file owns every
 * platform affordance: keyboard row activation, horizontal scroll, print and
 * phone compaction.
 */
export function MatrixTable({ plan, onRowPress }: MatrixTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headRow}>
            <th className={styles.cell} />
            {plan.head.map((cell, j) => (
              <th key={j} className={styles.cell} style={cell.style}>
                {cell.content}
              </th>
            ))}
            {plan.hasAction && <th className={styles.cell} />}
          </tr>
        </thead>
        <tbody>
          {plan.rows.map((row, i) => (
            <tr
              key={i}
              className={clsx(
                styles.row,
                row.highlighted && styles.rowHighlighted,
                row.clickable && styles.rowClickable,
              )}
              onClick={onRowPress ? () => onRowPress(i) : undefined}
              tabIndex={row.clickable ? 0 : undefined}
              onKeyDown={
                onRowPress && row.clickable
                  ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowPress(i))
                  : undefined
              }
            >
              <th className={clsx(styles.cell, styles.rowHeading)} style={row.heading.style}>
                {row.heading.content}
              </th>
              {row.cells.map((cell, j) => (
                <td key={j} className={styles.cell} style={cell.style}>
                  {cell.content}
                </td>
              ))}
              {plan.hasAction && (
                <td className={clsx(styles.cell, styles.actionCell)}>{row.action}</td>
              )}
            </tr>
          ))}
          {plan.summaries.map((summary, r) => (
            <tr key={r} className={styles.rollupRow}>
              <th className={clsx(styles.cell, styles.rowHeading)}>{summary.label}</th>
              {summary.cells.map((cell, j) => (
                <td key={j} className={styles.cell}>
                  {cell.content}
                </td>
              ))}
              {plan.hasAction && <td className={styles.cell} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
