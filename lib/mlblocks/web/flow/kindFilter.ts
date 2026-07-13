import { useMemo } from 'react';

import {
  DEFAULT_SHOWN_KINDS,
  PANEL_KINDS,
  complementKinds,
  type PanelKind,
} from '../../react/flow/panelKinds';
import { loadPageSet, savePageSet, usePageSetFilter } from './pageSetFilter';

// One cookie holds a { route → shown-kinds } map. Unlike the stage filter we
// store the *shown* set (missing entry = just the standard panels): the
// companion kinds default to hidden, including any added later.
const COOKIE = 'panelFilter';
const VALID = new Set<string>(PANEL_KINDS);

/** The panel kinds shown on `page`, restored from the cookie (default: standard only). */
export function loadShownKinds(page: string): Set<PanelKind> {
  return loadPageSet<PanelKind>(COOKIE, page, VALID, DEFAULT_SHOWN_KINDS);
}

/** Persist the kinds shown on `page` (dropping the entry when it's the default). */
export function saveShownKinds(page: string, shown: ReadonlySet<PanelKind>): void {
  savePageSet(COOKIE, page, shown, DEFAULT_SHOWN_KINDS);
}

/**
 * The per-page panel-kind filter: which kinds are hidden, persisted per route
 * in the panelFilter cookie (as the shown set), plus the toggle the filter bar
 * drives. The mirror of {@link useStageFilter}, on the kind axis.
 */
export function usePanelKindFilter() {
  const { values: shown, toggle: toggleKind } = usePageSetFilter(loadShownKinds, saveShownKinds);
  const hiddenKinds = useMemo(() => complementKinds(shown), [shown]);
  return { hiddenKinds, toggleKind };
}
