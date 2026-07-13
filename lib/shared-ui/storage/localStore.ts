import { useSyncExternalStore } from 'react';

import { readStoredJson } from './readJson';

/**
 * A module-level store persisted to one localStorage key, shared across every
 * same-origin document. This is the machine that the reminders store and
 * watch-tracker's store each hand-rolled: cached snapshot (stable reference for
 * `useSyncExternalStore`), an in-tab listener set, cross-tab sync via the
 * `storage` event, and best-effort writes.
 */
export interface LocalStore<T> {
  /** Current value (lazily hydrated from localStorage on first read). */
  get(): T;
  /** Replace the value, persist it, and notify every subscriber. */
  set(next: T): void;
  /** `set` from the current value — for immutable updates. */
  update(fn: (current: T) => T): void;
  /** Notify `listener` on every change (this tab and, via `storage`, others). */
  subscribe(listener: () => void): () => void;
  /** React hook: subscribe this component to the store's value. */
  useValue(): T;
}

/**
 * Create a {@link LocalStore} under `key`. `coerce` turns whatever was stored
 * into a valid `T`: it receives the parsed JSON, or `undefined` when the key is
 * missing, unparseable, or localStorage is unavailable — so it must supply the
 * default and defensively validate every field (stored data is untrusted: any
 * historical shape, or hand-edited, must coerce to something usable).
 */
export function createLocalStorageStore<T>(
  key: string,
  coerce: (stored: unknown) => T,
): LocalStore<T> {
  // Cached snapshot so `get` returns a stable reference between writes —
  // useSyncExternalStore compares by identity and would loop on a fresh parse.
  let cache: T;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function read(): T {
    // readStoredJson swallows missing-key / corrupt-JSON / no-localStorage to
    // `undefined`, so coerce always supplies the default in those cases.
    return coerce(readStoredJson(key));
  }

  function get(): T {
    if (!hydrated) {
      cache = read();
      hydrated = true;
    }
    return cache;
  }

  function emit(): void {
    for (const l of listeners) l();
  }

  function set(next: T): void {
    cache = next;
    hydrated = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Best-effort: a blocked/full localStorage just means no persistence.
    }
    emit();
  }

  function update(fn: (current: T) => T): void {
    set(fn(get()));
  }

  if (typeof window !== 'undefined') {
    // Cross-tab/app changes: drop the cache so the next read re-parses.
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        hydrated = false;
        emit();
      }
    });
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, get);
  }

  return { get, set, update, subscribe, useValue };
}
