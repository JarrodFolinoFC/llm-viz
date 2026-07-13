import { useCallback, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Track an element's rendered size via ResizeObserver, so SVG children can fill
 * it. `initial` is what renders before the first measurement (e.g. a sensible
 * map size to avoid a zero-height first paint).
 *
 * Returns a *callback ref* (not a RefObject) so it observes the element whenever
 * it attaches — including one that mounts later than the hook (e.g. a panel that
 * renders its measured child only after data loads). A plain effect-based
 * RefObject would bail on the first render when `ref.current` is still null and
 * never re-attach, leaving the size stuck at `initial`.
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(
  initial: ElementSize = { width: 0, height: 0 },
): [(node: T | null) => void, ElementSize] {
  const [size, setSize] = useState(initial);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    // React calls this with the node on attach and null on detach; tear down the
    // previous observer either way, then observe the new node if there is one.
    observer.current?.disconnect();
    if (!node) {
      observer.current = null;
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(node);
    observer.current = ro;
  }, []);

  return [ref, size];
}
