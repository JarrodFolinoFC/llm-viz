import { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import { errorMessage } from 'shared-ui';

import { useViewSettings } from '../../theme/ViewSettings';
import styles from './MermaidDiagram.module.css';

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });

/**
 * Render a mermaid definition to inline SVG. Re-renders whenever the chart text
 * or the light/dark theme changes; each render uses a fresh id so React 18's
 * double-invoked effects (and rapid step updates) never collide on mermaid's
 * temporary element.
 */
export function MermaidDiagram({ chart }: { chart: string }) {
  const { mode } = useViewSettings();
  const ref = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const baseId = `mermaid-${useId().replace(/[:]/g, '')}`;

  useEffect(() => {
    let cancelled = false;
    const id = `${baseId}-${seq.current++}`;
    mermaid
      .render(id, `%%{init: {"theme": "${mode === 'dark' ? 'dark' : 'neutral'}"}}%%\n${chart}`)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch((err: unknown) => {
        if (!cancelled && ref.current) {
          ref.current.textContent = `Diagram error: ${errorMessage(err)}`;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, mode, baseId]);

  return <div ref={ref} className={styles.diagram} role="img" aria-label="flow diagram" />;
}
