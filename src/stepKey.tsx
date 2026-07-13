import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import { StepBindingProvider, type StepHandler } from 'mlblocks';

/**
 * The `n` = "advance one training step" shortcut, app-wide. Successor to the
 * removed Vimium layer's binding: a plain window keydown listener wired into
 * mlblocks' StepBindingProvider seam — the FloatingDock registers the active
 * trainer's handler through it, so `n` steps the current page's trainer and
 * does nothing on pages without one. scripts/probe.mjs and smoke.mjs drive
 * training pages through this key.
 */
export function StepKeyProvider({ children }: { children: ReactNode }) {
  const stepRef = useRef<StepHandler | null>(null);
  const bind = useCallback((onStep: StepHandler) => {
    stepRef.current = onStep;
    return () => {
      if (stepRef.current === onStep) stepRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
      e.preventDefault();
      stepRef.current?.(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <StepBindingProvider value={bind}>{children}</StepBindingProvider>;
}
