/**
 * The handful of theme colours panels pass through Grid's *data-style* hooks
 * (header tints, heading highlights). They are CSS custom-property REFERENCES
 * — pure strings, no shared-ui import — which the web renderer's stylesheet
 * resolves. A native renderer's adapter maps these same names to concrete
 * values (shared-ui exports `resolveThemeColors` for exactly that); until it
 * exists this is the documented platform caveat of the style-hook pass-through
 * (the hooks narrow to tokens as the last consumers migrate).
 */
export const cssVar = {
  textPrimary: 'var(--c-text-primary)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted: 'var(--c-text-muted)',
  textEmphasis: 'var(--c-text-emphasis)',
  positive: 'var(--c-positive)',
  negative: 'var(--c-negative)',
  errorFg: 'var(--c-error-fg)',
  highlight: 'var(--c-highlight)',
  highlightBg: 'var(--c-highlight-bg)',
  chipPrevBg: 'var(--c-chip-prev-bg)',
  chipPrevFg: 'var(--c-chip-prev-fg)',
  chipNextBg: 'var(--c-chip-next-bg)',
  chipNextFg: 'var(--c-chip-next-fg)',
  bgSubtle: 'var(--c-bg-subtle)',
  borderStrong: 'var(--c-border-strong)',
} as const;
