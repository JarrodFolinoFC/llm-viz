import { useCookieState } from 'mlblocks';

/**
 * App-specific view settings that don't belong in mlblocks' ViewSettings.
 * Same cookie-backed shape; same cookie name as before the extraction, so
 * existing saved preferences keep working.
 */

/** Show W₁ as every word's derived push (E[w]·W₁ per slot) instead of its raw slot rows. */
export function useW1AllWords() {
  return useCookieState('w1AllWords', (raw) => raw === '1', (v) => (v ? '1' : '0'));
}
