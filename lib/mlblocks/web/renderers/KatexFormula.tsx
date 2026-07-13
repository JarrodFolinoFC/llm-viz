import katex from 'katex';
import { useMemo } from 'react';

/**
 * The web implementation of the Formula renderer slot: KaTeX markup derived
 * purely at render (no refs, no effect, no blank first paint). Consumers load
 * KaTeX's stylesheet via the app's own CSS pipeline (`katex/dist/katex.min.css`
 * ships with the `mlblocks/style.css` bundle).
 */
export function KatexFormula({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false }),
    [tex, display],
  );
  return display ? (
    <div data-testid="formula-display" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span data-testid="formula-display" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
