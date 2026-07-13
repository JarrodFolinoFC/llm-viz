import { useEffect } from 'react';

import { useUrlPatch } from '../lib/urlState';
import type { TrainingStage } from '../../core/stage';
import { usePageSetFilter } from './pageSetFilter';
import { loadHiddenStages, saveHiddenStages } from './stageFilterCookie';

/**
 * The page's initial hidden set. A `?hide=` in the URL wins over the saved
 * cookie — an empty `hide=` means "show all" — so a shared link reproduces the
 * visible stages; with no `hide` param we fall back to the per-page cookie.
 * Ids not among this page's `stages` are dropped.
 */
function initialHidden(page: string, stages: readonly TrainingStage[]): Set<TrainingStage> {
  const raw = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('hide') : null;
  if (raw !== null) {
    const wanted = new Set(raw.split(',').filter(Boolean));
    return new Set(stages.filter((s) => wanted.has(s)));
  }
  return loadHiddenStages(page);
}

/**
 * The per-page stage filter: which training stages are hidden, persisted per
 * route in the stageFilter cookie AND mirrored to the `hide` query param (so the
 * page is bookmarkable), plus the three operations the StageSelect bar drives.
 * Owned once here, so FlowWithChart and the chart-less flows (FlowRenderer's
 * self-filtered mode) share one implementation instead of each keeping its own
 * copy of the toggle logic.
 */
export function useStageFilter(stages: readonly TrainingStage[]) {
  const { values: hidden, toggle, setAll, clear } = usePageSetFilter<TrainingStage>(
    (page) => initialHidden(page, stages),
    saveHiddenStages,
  );

  // Mirror the filter to the URL in canonical (stage-order) form so the param
  // doesn't churn on re-render; empty → drop it. `stages` only ever renders on
  // training pages, so this never touches a non-training URL.
  const patch = useUrlPatch();
  const hideParam = stages.filter((s) => hidden.has(s)).join(',');
  useEffect(() => {
    patch({ hide: hideParam || null });
  }, [hideParam, patch]);

  return { hidden, toggle, showAll: clear, hideAll: () => setAll(stages) };
}
