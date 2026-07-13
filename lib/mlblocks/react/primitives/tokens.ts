/**
 * The style vocabulary headless components speak — a typed, renderer-neutral
 * token set instead of CSS classes. Names mirror the shared-ui CSS variables
 * the web renderer resolves them to (`var(--c-…)` / `var(--space-…)`), so the
 * theme system — dark mode, applyThemeVars, colour overrides — keeps working
 * unchanged; a native renderer instead resolves the same tokens to concrete
 * values (shared-ui exports `resolveThemeColors` for exactly that).
 *
 * Computed colours (heatmaps, colormaps, stage tints) pass through as
 * `{ raw }` values — they are data, not theme.
 */

/** Theme-token colours. Grows as the wave migrations surface more variables. */
export type ColorToken =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'textEmphasis'
  | 'border'
  | 'borderStrong'
  | 'infoFg'
  | 'infoBg'
  | 'infoBorder'
  | 'highlight'
  | 'highlightBg'
  | 'surface'
  | 'surfaceSubtle'
  // signed-value + training-state semantics (the signedCell convention)
  | 'positive'
  | 'negative'
  | 'errorFg'
  | 'randomInit'
  // token-chip pair (prev = context, next = target)
  | 'chipPrevFg'
  | 'chipPrevBg'
  | 'chipNextFg'
  | 'chipNextBg';

/** A computed (non-theme) colour — heatmap output, a stage tint, etc. */
export interface RawColor {
  raw: string;
}

export type ColorValue = ColorToken | RawColor;

export type SpaceToken = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';

export type FontToken = 'xs' | 'sm' | 'md' | 'lg';

/**
 * The style object headless components attach to primitives. Deliberately
 * small: anything a component can't say with `Sty` is either an interaction
 * state (a semantic flag the renderer styles) or renderer-internal chrome.
 */
export interface Sty {
  /** Padding (all sides / horizontal / vertical). */
  p?: SpaceToken | number;
  px?: SpaceToken | number;
  py?: SpaceToken | number;
  /** Margins — used sparingly; prefer parent gap. */
  mb?: SpaceToken | number;
  mr?: SpaceToken | number;
  /** Gap between children (layout primitives). */
  gap?: SpaceToken | number;
  color?: ColorValue;
  bg?: ColorValue;
  borderColor?: ColorValue;
  radius?: 'sm' | 'md';
  font?: FontToken;
  /** Relative font size (tracks the parent, e.g. a panel-title suffix). */
  em?: number;
  /** Absolute font size in rem (visual-parity escape hatch). */
  fontRem?: number;
  /** Max width in rem (tooltip cards and similar prose containers). */
  maxwRem?: number;
  /** Fixed width in ch (digit-column slots that must stack column-for-column). */
  wch?: number;
  /** Max width in ch (prose asides). */
  maxwCh?: number;
  /** Accent inline-start border (note asides tinted to their stage). */
  accentBorder?: ColorValue;
  /** Line height (unitless) + reserved min height in em (annotation lines
   *  that must hold their slot even when empty, for row alignment). */
  lh?: number;
  minhEm?: number;
  mono?: boolean;
  bold?: boolean;
  /** Tabular (fixed-width) numerals, for columns of digits. */
  tabular?: boolean;
  nowrap?: boolean;
  align?: 'left' | 'right' | 'center';
  /** The "has an explanation" affordance (dotted underline + help cursor on web). */
  deco?: 'underlineDotted';
}
