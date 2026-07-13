import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { readCookie, writeCookie } from './cookie';

/**
 * `useState` whose value survives reloads through a caller-supplied load/save
 * pair. The persist effect lives here once instead of hand-written at every
 * call site; it also runs on mount, which just writes back what was loaded
 * (and, for cookies, refreshes the max-age).
 */
export function usePersistentState<T>(
  load: () => T,
  save: (value: T) => void,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(load);
  // Callers pass `save` as an inline closure — track the latest one in a ref
  // (updated in its own effect, which runs before the persist effect below)
  // so its changing identity doesn't re-run the persist.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    saveRef.current(value);
  }, [value]);
  return [value, setValue];
}

/**
 * `useState` mirrored into a cookie: lazily initialised via `parse` (which
 * receives `null` when the cookie is absent — return the default), written
 * back through `serialize` on every change.
 *
 *     const [open, setOpen] = useCookieState('sidebarOpen', (raw) => raw === '1', (v) => (v ? '1' : '0'));
 */
export function useCookieState<T>(
  name: string,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
): [T, Dispatch<SetStateAction<T>>] {
  return usePersistentState(
    () => parse(readCookie(name)),
    (value) => writeCookie(name, serialize(value)),
  );
}
