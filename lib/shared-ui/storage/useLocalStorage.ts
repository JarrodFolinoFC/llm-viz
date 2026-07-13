import { useEffect, useRef, useState } from 'react';

import { readStoredJson } from './readJson';

/** The stored value under `key`, or `fallback` when it's absent/corrupt. Shared
 *  by every hydration path below (initial state, key change, cross-tab sync). */
function hydrate<T>(key: string, fallback: T): T {
  const stored = readStoredJson(key);
  return stored === undefined ? fallback : (stored as T);
}

/**
 * `useState` that persists to localStorage under `key`. The apps have no
 * backend — a refresh re-hydrates from the browser.
 *
 * Also listens to the `storage` event, so two documents on the shared origin
 * (two tabs, or an app plus its federated `home` panel) can't silently diverge:
 * a write elsewhere re-hydrates this hook's state.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  // `initial` is often an inline literal; keep the first value in a ref so the
  // storage listener doesn't re-subscribe (or re-hydrate) on every render.
  const initialRef = useRef(initial);

  // `initial` (not the ref) on first render — reading a ref during render is
  // flagged, and on the first render they're the same value anyway.
  const [value, setValue] = useState<T>(() => hydrate(key, initial));

  // Tracks which key `value` belongs to, so a key change re-hydrates instead of
  // writing the previous key's value under the new key.
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(hydrate(key, initialRef.current));
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota / serialization errors — state stays in memory regardless.
    }
  }, [key, value]);

  useEffect(() => {
    // `storage` only fires in *other* documents, so re-hydrating here can't
    // loop with the persist effect above.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key && e.key !== null) return;
      setValue(hydrate(key, initialRef.current));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue] as const;
}
