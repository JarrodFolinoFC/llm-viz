import type { IconName } from '../primitives/icons';
import { useP } from '../primitives/context';
import { textStyles } from './textStyles';

/**
 * Consistent marker for a panel's place in the update cycle, derived from the
 * phase text: a "rewind" glyph for the pre-update (before) state and a "check"
 * for the post-update (after) state. Nothing for phases that aren't about the
 * update (e.g. dimensions or "(random)").
 */
function updateIcon(phase: string): { name: IconName; title: string } | null {
  const p = phase.toLowerCase();
  if (p.includes('before')) return { name: 'history', title: "before this step's update" };
  if (p.includes('after')) return { name: 'checkCircle', title: "after this step's update" };
  return null;
}

/**
 * The muted phase suffix shown after a panel's title symbol, with a consistent
 * before/after-update icon when the phase denotes one. Single definition so the
 * suffix styling and the update marker live in one place.
 */
export function PhaseTag({ phase, parens = false }: { phase?: string | null; parens?: boolean }) {
  const P = useP();
  if (phase == null || phase === '') return null;
  const icon = updateIcon(phase);
  return (
    <P.View inline align="baseline" gap={4} sty={textStyles.phase}>
      {icon && (
        <P.Tip content={icon.title}>
          <P.Icon name={icon.name} />
        </P.Tip>
      )}
      <P.Text>{parens ? `(${phase})` : phase}</P.Text>
    </P.View>
  );
}
