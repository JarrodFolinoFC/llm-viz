// Default number of decimal places for numeric readouts (the common `toFixed`).
// This is the fallback/initial value; the live setting lives in ViewSettings
// (cookie-persisted) and, for non-React callers, in `activePrecision.ts`.
export const PRECISION: Precision = 2;

/** The decimal-place choices offered by the View panel. */
export type Precision = 2 | 3 | 4;

export const PRECISIONS: Precision[] = [2, 3, 4];
