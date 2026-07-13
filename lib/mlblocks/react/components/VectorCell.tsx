import type { ReactNode } from 'react';

import { useP } from '../primitives/context';
import { useTrainerSettings } from '../settings';
import type { Sty } from '../primitives/tokens';
import { StackedCell } from './StackedCell';

export interface VectorCellProps {
  /** The components of the weight vector (e.g. a 4-d embedding). */
  values: number[];
  /** Decimal places per component. */
  precision?: number;
  /** Color each component green/red by sign instead of the default flat ink. */
  signed?: boolean;
  /** Flat color for every component (ignored when `signed`). */
  color?: string;
  /** Optional small annotation stacked above each component (e.g. its Δ this
   *  step). When provided, every component reserves an annotation line so rows
   *  stay aligned; entries may be null where there's nothing to show. */
  annotations?: (ReactNode | null)[];
}

// Reserve a fixed-width, right-aligned slot per component so digits stack
// column-for-column down the grid: one sign char + "0." + the decimals. The
// minus sign sits in the reserved left padding instead of shifting the digits.
const componentSty = (precision: number): Sty => ({
  wch: precision + 3,
  align: 'right',
});

/**
 * Renders a weight vector as a compact horizontal number strip — the
 * `[-.24 .11 -.03 .42]` layout — so a Grid cell can hold a 4-d vector in the
 * same footprint the scalar panels use for one number. Drop it into any Grid cell.
 */
export function VectorCell({ values, precision: precisionProp, signed = false, color: ink, annotations }: VectorCellProps) {
  const P = useP();
  const { precision: globalPrecision } = useTrainerSettings();
  const precision = precisionProp ?? globalPrecision;
  return (
    <P.View inline align="baseline" gap={4} sty={{ tabular: true, font: 'sm', nowrap: true }}>
      <P.Text color="textMuted">[</P.Text>
      <P.View inline gap="sm">
        {values.map((v, i) => {
          const main = (
            <P.Text
              key={annotations ? undefined : i}
              sty={{
                ...componentSty(precision),
                // One sign convention app-wide: green positive, red negative.
                ...(signed
                  ? { color: v >= 0 ? ('positive' as const) : ('errorFg' as const) }
                  : ink
                    ? { color: { raw: ink } }
                    : {}),
              }}
            >
              {v.toFixed(precision)}
            </P.Text>
          );
          if (!annotations) return main;
          const a = annotations[i];
          return <StackedCell key={i} annotations={a != null ? [a] : []} main={main} />;
        })}
      </P.View>
      <P.Text color="textMuted">]</P.Text>
    </P.View>
  );
}
