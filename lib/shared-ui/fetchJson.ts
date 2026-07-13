/**
 * `fetch` a JSON resource, throwing a render-ready error on a non-2xx response
 * — the `fetch → !res.ok → res.json()` dance every app hand-rolled. Pairs with
 * {@link useAsync}, which turns the thrown message into its `error` state.
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    // The last path segment reads better than a full URL in an inline alert.
    const name = url.split('?')[0].split('/').filter(Boolean).pop() ?? url;
    throw new Error(`${name}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Normalise an unknown thrown value to a display string — the
 * `e instanceof Error ? e.message : String(e)` dance every `catch` hand-rolled.
 * Use in `catch (e)` blocks feeding a message/alert.
 */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
