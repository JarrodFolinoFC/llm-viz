import { useP } from '../primitives/context';

export interface FormulaDisplayProps {
  latex: string;
  inline?: boolean;
}

/**
 * Slot host for maths markup: renders through the active renderer's `Formula`
 * slot (KaTeX on web). When the renderer provides none, falls back to the raw
 * TeX in monospace — legible, if unlovely, on platforms without a math engine.
 */
export function FormulaDisplay({ latex, inline = false }: FormulaDisplayProps) {
  const P = useP();
  if (P.Formula) return <P.Formula tex={latex} display={!inline} />;
  return <P.Text sty={{ mono: true }}>{latex}</P.Text>;
}
