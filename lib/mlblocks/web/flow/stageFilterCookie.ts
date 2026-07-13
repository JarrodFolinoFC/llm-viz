import { TrainingStage } from '../../core/stage';
import { loadPageSet, savePageSet } from './pageSetFilter';

// One cookie holds a { route → hidden-stages } map, so each page remembers which
// stages it's showing. We store the *hidden* set (empty = all shown), so stages
// added later default to visible.
const COOKIE = 'stageFilter';
const VALID = new Set<string>(Object.values(TrainingStage));

/** The stages hidden on `page`, restored from the cookie. */
export function loadHiddenStages(page: string): Set<TrainingStage> {
  return loadPageSet<TrainingStage>(COOKIE, page, VALID);
}

/** Persist the stages hidden on `page` (dropping the entry when nothing is hidden). */
export function saveHiddenStages(page: string, hidden: ReadonlySet<TrainingStage>): void {
  savePageSet(COOKIE, page, hidden);
}
