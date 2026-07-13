import { createContext, useContext, useEffect } from 'react';

export type StepHandler = (n: number) => void;

/** Register a step handler; may return an unregister cleanup. */
export type StepBinder = (onStep: StepHandler) => (() => void) | void;

/**
 * The keyboard seam for the page-level "advance one training step" shortcut
 * (`n` in llm-trainer's Vimium layer). mlblocks never depends on a keyboard
 * layer: the app provides a binder — the FloatingDock registers the active
 * trainer's handler through it. Null default = no keyboard layer, no-op.
 */
const Ctx = createContext<StepBinder | null>(null);

export const StepBindingProvider = Ctx.Provider;

/** Register the current page's step handler with the app's keyboard layer. */
export function useStepBinding(onStep: StepHandler): void {
  const bind = useContext(Ctx);
  useEffect(() => bind?.(onStep) ?? undefined, [bind, onStep]);
}
