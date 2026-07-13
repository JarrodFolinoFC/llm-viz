import { createContext, useContext } from 'react';

import type { Primitives } from './types';

/**
 * The active renderer. Null-default so a missing provider fails loudly at the
 * first primitive use rather than silently rendering nothing — wrap web apps
 * in `MLBlocksProvider` (from `mlblocks`), native apps in their own provider.
 */
export const PrimitivesContext = createContext<Primitives | null>(null);

export function useP(): Primitives {
  const p = useContext(PrimitivesContext);
  if (!p) {
    throw new Error(
      'mlblocks: no renderer mounted — wrap the app in MLBlocksProvider (web) or a native PrimitivesContext provider.',
    );
  }
  return p;
}
