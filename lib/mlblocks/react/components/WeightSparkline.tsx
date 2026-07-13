import { useP } from '../primitives/context';
import type { SparklineProps } from '../primitives/types';

export type WeightSparklineProps = SparklineProps;

/** A data-cell-sized signed sparkline of one weight over training — pure
 *  pass-through to the renderer's Sparkline (the geometry lives with the
 *  drawing surface; see the web adapter for the signed-fill convention). */
export function WeightSparkline(props: WeightSparklineProps) {
  const P = useP();
  return <P.Sparkline {...props} />;
}
