/**
 * Read `localStorage[key]` and JSON-parse it, returning `undefined` when the key
 * is missing, the value is unparseable, or localStorage is unavailable (private
 * mode / SSR). The single spot that owns the read-parse-swallow dance both the
 * `useLocalStorage` hook and `createLocalStorageStore` were each hand-rolling.
 *
 * Returns `unknown` on purpose: stored data is untrusted (any historical shape,
 * or hand-edited), so callers coerce/validate it or fall back to a default.
 */
export function readStoredJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : undefined;
  } catch {
    return undefined;
  }
}
