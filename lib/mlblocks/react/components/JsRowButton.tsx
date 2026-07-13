import { useP } from '../primitives/context';
import { useViewOptions } from '../viewOptions';
import { useMathConsole } from '../flow/mathConsole';
import type { Snippet } from '../lib/snippets';

/**
 * A tiny JS affordance rendered per calculation row. Clicking it loads (and
 * runs) that row's snippet in the page's math console. Renders nothing when no
 * console is available (isolated stories/tests, platforms without one) or when
 * code actions are hidden.
 */
export function JsRowButton({ snippet, label = 'this row' }: { snippet: Snippet; label?: string }) {
  const P = useP();
  const { send, available } = useMathConsole();
  const { hideActions } = useViewOptions();
  if (!available || hideActions) return null;
  return (
    <P.Tip content={`Open this calculation (${label}) in the math console`}>
      <P.Pressable onPress={() => send(snippet)} label={`JS for ${label}`} sty={{ p: 1, radius: 'sm', color: 'textMuted' }}>
        <P.Icon name="js" />
      </P.Pressable>
    </P.Tip>
  );
}
