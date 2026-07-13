import { cssVar } from '../lib/cssVars';

// One sign convention for every signed value in the training flow: positive is
// green, negative is red, with a ↑/↓ glyph as a redundant (color-blind-safe)
// channel so the sign never depends on hue alone.
export const signColor = (v: number) => (v >= 0 ? cssVar.positive : cssVar.errorFg);
export const signArrow = (v: number) => (v >= 0 ? '↑' : '↓');
