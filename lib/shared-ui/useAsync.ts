import { useCallback, useEffect, useState } from 'react';

export interface AsyncState<T> {
  /** The resolved value, or null while loading / after an error / mid-reload. */
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Run `fn` again (e.g. after a mutation invalidates the data). */
  reload: () => void;
}

/**
 * Run an async producer once per `deps` change, with the unmount/re-run guard
 * every app used to hand-roll (`let cancelled = …`): a stale promise settling
 * after cleanup can't clobber newer state. Errors are captured as a message
 * string, ready to render.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<Omit<AsyncState<T>, 'reload'>>({
    data: null,
    error: null,
    loading: true,
  });
  // Bumping this re-triggers the effect with the same deps — that's `reload`.
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Reset on deps change so a slow fetch can't clobber the new request's view.
    setState({ data: null, error: null, loading: true });
    fn().then(
      (data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      },
      (e: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            error: e instanceof Error ? e.message : String(e),
            loading: false,
          });
      },
    );
    return () => {
      cancelled = true;
    };
    // `fn` is intentionally not a dep — callers pass inline closures; `deps`
    // declares what actually invalidates the data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, runId]);

  const reload = useCallback(() => setRunId((t) => t + 1), []);

  return { ...state, reload };
}
