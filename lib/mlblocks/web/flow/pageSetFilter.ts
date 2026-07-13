import { usePersistentState } from '../lib/useCookieState';
import { readCookie, writeCookie } from '../lib/cookie';

/**
 * The one machine behind the per-page flow filters (stage, tensor, panel
 * kind). Each persists a per-route Set in a JSON cookie holding a
 * { route → values } map — previously copy-pasted into stageFilterCookie,
 * paramFilter and panelKinds, extracted here the same way readCookie/
 * writeCookie were (see lib/cookie.ts).
 */

/** The current page, used to key its saved per-page filters (BrowserRouter → real path). */
export const currentPage = () => (typeof window !== 'undefined' ? window.location.pathname : '/');

/** The cookie's { route → values } map, defensively parsed (corrupt → {}). */
function readPageMap(cookie: string): Record<string, unknown> {
  const raw = readCookie(cookie);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * The values stored for `page`, validated against `valid`. A missing entry —
 * or a corrupted, non-array one — falls back to `defaultValues`.
 */
export function loadPageSet<T extends string>(
  cookie: string,
  page: string,
  valid: ReadonlySet<string>,
  defaultValues: readonly T[] = [],
): Set<T> {
  const entry = readPageMap(cookie)[page];
  const list = (Array.isArray(entry) ? entry : defaultValues).filter((v) => valid.has(v));
  return new Set(list as T[]);
}

/**
 * Persist the values stored for `page`, dropping the route's entry when it
 * matches `defaultValues` so the cookie only records deviations.
 */
export function savePageSet(
  cookie: string,
  page: string,
  values: ReadonlySet<string>,
  defaultValues: readonly string[] = [],
): void {
  const map = readPageMap(cookie);
  const isDefault = values.size === defaultValues.length && defaultValues.every((v) => values.has(v));
  if (isDefault) delete map[page];
  else map[page] = [...values];
  writeCookie(cookie, JSON.stringify(map));
}

/**
 * The current page's filter Set, restored through `load` and persisted through
 * `save`, plus the updaters the filter bars drive: toggle one value, set the
 * whole list, or clear back to empty.
 */
export function usePageSetFilter<T extends string>(
  load: (page: string) => Set<T>,
  save: (page: string, values: ReadonlySet<T>) => void,
) {
  const page = currentPage();
  const [values, setValues] = usePersistentState<ReadonlySet<T>>(
    () => load(page),
    (v) => save(page, v),
  );

  const toggle = (value: T) =>
    setValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  const setAll = (all: readonly T[]) => setValues(new Set(all));
  const clear = () => setValues(new Set<T>());

  return { values, toggle, setAll, clear };
}
