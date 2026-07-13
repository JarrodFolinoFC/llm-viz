import { useP } from '../primitives/context';
import { useTrainerSettings } from '../settings';

export interface NumericCellProps {
  value: number;
  decimals?: number;
  signed?: boolean;
  prefix?: string;
  colorFn?: (value: number, isHighlighted: boolean) => string;
  isHighlighted?: boolean;
}

/** A single numeric value that never wraps mid-number. Colour is data-driven
 *  (sign/highlight) and passes through as a raw value. */
export function NumericCell({
  value,
  decimals,
  signed = false,
  prefix,
  colorFn,
  isHighlighted = false,
}: NumericCellProps) {
  const P = useP();
  // Falls back to the global decimal-places setting when no explicit override.
  const { precision } = useTrainerSettings();
  const places = decimals ?? precision;
  const resolvedColor = colorFn?.(value, isHighlighted);
  return (
    <P.Text sty={{ nowrap: true, ...(resolvedColor ? { color: { raw: resolvedColor } } : {}) }}>
      {prefix != null && `${prefix} `}
      {signed && value >= 0 ? '+' : ''}
      {value.toFixed(places)}
    </P.Text>
  );
}
