import { PRECISION, type Precision } from './precision';

/**
 * The live decimal precision for *non-React* callers — the snippet builder and
 * the JS-console formatter, which run on demand (click / eval) and so can read a
 * module variable at call-time rather than through React context. The
 * ViewSettings provider keeps this in sync with the cookie-backed setting; React
 * components instead read `useViewSettings().precision` so they re-render.
 */
let active: Precision = PRECISION;

export const getActivePrecision = (): Precision => active;

export const setActivePrecision = (p: Precision) => {
  active = p;
};
