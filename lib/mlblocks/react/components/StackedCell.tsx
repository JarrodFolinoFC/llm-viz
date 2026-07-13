import type { ReactNode } from 'react';

import { useP } from '../primitives/context';

export interface StackedCellProps {
  /** Small secondary values rendered above the main value (e.g. old value,
   *  delta). Each can carry its own color. */
  annotations?: ReactNode[];
  /** The primary value shown beneath the annotations. */
  main: ReactNode;
  /** Color for the main value. */
  color?: string;
}

/**
 * Stacks a row of small annotations on top of a main value — the
 * `hat / -0.24 -0.07 / -0.31` layout. Drop it into any Grid cell. The
 * annotation line reserves its slot even when empty so rows stay aligned.
 */
export function StackedCell({ annotations, main, color: mainColor }: StackedCellProps) {
  const P = useP();
  return (
    <P.View direction="col" align="end" sty={{ nowrap: true }}>
      <P.View gap={5} justify="end" sty={{ font: 'sm', color: 'textMuted', lh: 1.1, minhEm: 1.1 }}>
        {annotations?.length ? annotations.map((a, i) => <P.Text key={i}>{a}</P.Text>) : ' '}
      </P.View>
      <P.Text sty={mainColor ? { color: { raw: mainColor } } : undefined}>{main}</P.Text>
    </P.View>
  );
}
