import { createContext, useContext } from 'react';

import type { Snippet } from '../lib/snippets';

export interface MathConsoleApi {
  /** Open the console and load/run a row's snippet. */
  send: (snippet: Snippet) => void;
  /** False when no console is mounted (e.g. in isolated stories/tests). */
  available: boolean;
}

export const MathConsoleContext = createContext<MathConsoleApi>({
  send: () => {},
  available: false,
});

/** Access the page's math console from any panel. */
export const useMathConsole = () => useContext(MathConsoleContext);
