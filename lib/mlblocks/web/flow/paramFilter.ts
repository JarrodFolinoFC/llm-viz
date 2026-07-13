import { loadPageSet, savePageSet, usePageSetFilter } from './pageSetFilter';
import { paramSet } from '../../react/flow/paramTensor';

/**
 * The per-page parameter/tensor filter: which tensors are hidden, persisted per
 * route in the paramFilter cookie, plus the toggle the "Parameters" group of
 * the filter bar drives. The mirror of {@link useStageFilter}, on the tensor
 * axis — a panel is dropped when *all* of the tensors it touches are hidden
 * (see FlowRenderer's `tensorVisible`).
 */

// One cookie holds a { route → hidden-tensors } map. We store the *hidden* set
// (empty = all shown), so tensors added later default to visible.
const COOKIE = 'paramFilter';

/** The tensors hidden on `page`, restored from the cookie. */
export function loadHiddenTensors(page: string): Set<string> {
  return loadPageSet(COOKIE, page, paramSet());
}

/** Persist the tensors hidden on `page` (dropping the entry when none is hidden). */
export function saveHiddenTensors(page: string, hidden: ReadonlySet<string>): void {
  savePageSet(COOKIE, page, hidden);
}

export function usePanelTensorFilter(tensors: readonly string[]) {
  const { values: hiddenTensors, toggle: toggleTensor, setAll, clear } = usePageSetFilter(
    loadHiddenTensors,
    saveHiddenTensors,
  );
  return {
    hiddenTensors,
    toggleTensor,
    showAllTensors: clear,
    hideAllTensors: () => setAll(tensors),
  };
}
