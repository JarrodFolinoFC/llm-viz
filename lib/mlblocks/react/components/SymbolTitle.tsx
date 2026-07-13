import { useP } from '../primitives/context';
import { FormulaDisplay } from './FormulaDisplay';
import { PhaseTag } from './PhaseTag';
import { TokenChip } from './TokenChip';

export interface SymbolTitleProps {
  /** LaTeX symbol shown first (e.g. "W_1", "\\nabla z_2", a softmax formula). */
  symbol: string;
  /** Optional context-token chip after the symbol (amber, like the corpus and
   *  "given ⟨…⟩" chips) — e.g. the trigram's active slice index: `W ⟨dog⟩`. */
  tokenChip?: string;
  /** Optional muted suffix after the symbol (e.g. "before step", "(random)"). */
  phase?: string | null;
  /** Wrap the phase in parentheses (some panels render "(before)" rather than "before"). */
  parens?: boolean;
}

/**
 * The shared panel title: a formula symbol followed by an optional muted phase
 * tag. Single definition for every heatmap/vector panel so the symbol/phase
 * layout decision lives in one place.
 */
export function SymbolTitle({ symbol, tokenChip, phase, parens = false }: SymbolTitleProps) {
  const P = useP();
  return (
    <P.View inline align="baseline" gap="xs">
      <FormulaDisplay inline latex={symbol} />
      {tokenChip != null && <TokenChip text={tokenChip} isPrev />}
      <PhaseTag phase={phase} parens={parens} />
    </P.View>
  );
}
