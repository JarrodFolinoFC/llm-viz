import { useP } from '../primitives/context';
import { FormulaDisplay } from './FormulaDisplay';

export interface TermProps {
  label: string;
  /** Render the visible trigger as inline maths (this LaTeX) instead of `label`.
   *  `label` is still used for the accessible name. */
  labelLatex?: string;
  explain: string;
  formula?: string;
}

/** An inline defined-term: dotted-underlined text that reveals an explanation
 *  (and optional formula) on hover/focus via the renderer's Tip. */
export function Term({ label, labelLatex, explain, formula }: TermProps) {
  const P = useP();
  const card = (
    <P.View direction="col" sty={{ maxwRem: 22, gap: 'xs' }}>
      <P.Text>{explain}</P.Text>
      {formula && <FormulaDisplay latex={formula} />}
    </P.View>
  );

  return (
    <P.Tip content={card}>
      {/* A focusable span, not a button: terms are definitions, not controls —
          keyboard users can reach them, but they carry no pressable semantics. */}
      <P.Text focusable label={label} sty={{ deco: 'underlineDotted' }}>
        {labelLatex ? <FormulaDisplay inline latex={labelLatex} /> : label}
      </P.Text>
    </P.Tip>
  );
}
