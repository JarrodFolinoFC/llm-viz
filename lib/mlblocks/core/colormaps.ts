// Reusable cell-background colormaps for matrix heatmaps. Each factory returns a
// `(value, i, j) => string` compatible with Heatmap's `cellBackground` prop.

export type Colormap = (value: number, i: number, j: number) => string;

// Flat colormap: no tint, so the cell shows the themed panel background through
// it (white in light mode, dark in dark mode). Was a hardcoded '#ffffff', which
// rendered as solid white cells in dark mode.
const flatColormap: Colormap = () => 'transparent';

// Value-ramped greyscale: cells darken with |value| (normalized by maxAbs, so a
// value at maxAbs is darkest and 0 is near-white). Used to render the untrained
// step-0 state in neutral grey. Probability tables can omit maxAbs (values lie
// in [0, 1]).
function greyscaleColormap(
  maxAbs = 1,
  { base = 0.05, range = 0.55 }: { base?: number; range?: number } = {}
): Colormap {
  const grey: RGB = [80, 80, 80];
  return (value) => rgba(grey, base + range * Math.min(1, Math.abs(value) / maxAbs));
}

// Background colormap for a live table: a value-ramped greyscale before training
// (step 0), then flat/untinted once weights start moving (so the themed panel
// background shows through). Pass `matrix` to scale the grey ramp to its
// magnitude; omit it for probability tables (values are already in [0, 1]).
export function stepColormap(step: number | null, matrix?: number[][]): Colormap {
  if (step !== 0) return flatColormap;
  const maxAbs = matrix
    ? Math.max(1e-6, ...matrix.flat().map((v) => Math.abs(v)))
    : 1;
  return greyscaleColormap(maxAbs);
}

type RGB = readonly [number, number, number];

const rgba = ([r, g, b]: RGB, alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

// Single-hue ramp: alpha grows with value (expected in [0, 1]).
// alpha = base + range * value.
export function sequentialColormap(
  rgb: RGB,
  { base = 0.1, range = 0.6 }: { base?: number; range?: number } = {}
): Colormap {
  return (value) => rgba(rgb, base + range * value);
}

export function divergingColormap(
  maxAbs: number,
  {
    pos = [59, 130, 246] as RGB,
    neg = [239, 68, 68] as RGB,
    base = 0.1,
    range = 0.5,
  }: { pos?: RGB; neg?: RGB; base?: number; range?: number } = {}
): Colormap {
  return (value) => {
    const t = value / maxAbs;
    return t >= 0 ? rgba(pos, base + range * t) : rgba(neg, base + range * -t);
  };
}

// Signed heatmap matching the signedCell convention: green for positive, red for
// negative (theme color.positive #2a7 → rgb(34,170,119), color.negative #d35 →
// rgb(221,51,85)). The cell still shows its numeric value, so hue is never the
// sole channel — color-blind safe.
export function signedColormap(maxAbs: number): Colormap {
  return divergingColormap(maxAbs, { pos: [34, 170, 119], neg: [221, 51, 85] });
}

// Probability ramp (green) with two demo-specific special cases: the cat→on
// cell is highlighted, and zero-probability cells use the surface background.

