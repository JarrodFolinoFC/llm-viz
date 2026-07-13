import type { CSSProperties } from 'react';

import type { ColorValue, FontToken, SpaceToken, Sty } from '../../react/primitives/tokens';

// Token → CSS-variable REFERENCES (not values), so shared-ui's theme system —
// dark mode, applyThemeVars, per-token colour overrides — keeps driving the
// rendered colours with zero involvement from mlblocks. A native renderer
// resolves the same tokens to concrete values instead. Var names match
// shared-ui's palette.ts `color` object.
const COLOR_VARS: Record<Exclude<ColorValue, { raw: string }>, string> = {
  text: 'var(--c-text-primary)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted: 'var(--c-text-muted)',
  textEmphasis: 'var(--c-text-emphasis)',
  border: 'var(--c-border-default)',
  borderStrong: 'var(--c-border-strong)',
  infoFg: 'var(--c-info-fg)',
  infoBg: 'var(--c-info-bg)',
  infoBorder: 'var(--c-info-border)',
  highlight: 'var(--c-highlight)',
  highlightBg: 'var(--c-highlight-bg)',
  surface: 'var(--c-bg-surface)',
  surfaceSubtle: 'var(--c-bg-subtle)',
  positive: 'var(--c-positive)',
  negative: 'var(--c-negative)',
  errorFg: 'var(--c-error-fg)',
  randomInit: 'var(--c-random-init)',
  chipPrevFg: 'var(--c-chip-prev-fg)',
  chipPrevBg: 'var(--c-chip-prev-bg)',
  chipNextFg: 'var(--c-chip-next-fg)',
  chipNextBg: 'var(--c-chip-next-bg)',
};

const SPACE_VARS: Record<SpaceToken, string> = {
  xxs: 'var(--space-xxs)',
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
};

const FONT_VARS: Record<FontToken, string> = {
  xs: 'var(--font-size-xs)',
  sm: 'var(--font-size-sm)',
  md: 'var(--font-size-md)',
  lg: 'var(--font-size-lg)',
};

export const resolveColor = (c: ColorValue): string =>
  typeof c === 'string' ? COLOR_VARS[c] : c.raw;

export const resolveSpace = (s: SpaceToken | number): string | number =>
  typeof s === 'number' ? s : SPACE_VARS[s];

/** `Sty` → inline CSS. The web renderer's half of the styling contract. */
export function resolveSty(sty?: Sty): CSSProperties {
  if (!sty) return {};
  const css: CSSProperties = {};
  if (sty.p !== undefined) css.padding = resolveSpace(sty.p);
  if (sty.px !== undefined) {
    css.paddingLeft = resolveSpace(sty.px);
    css.paddingRight = resolveSpace(sty.px);
  }
  if (sty.py !== undefined) {
    css.paddingTop = resolveSpace(sty.py);
    css.paddingBottom = resolveSpace(sty.py);
  }
  if (sty.mb !== undefined) css.marginBottom = resolveSpace(sty.mb);
  if (sty.mr !== undefined) css.marginRight = resolveSpace(sty.mr);
  if (sty.gap !== undefined) css.gap = resolveSpace(sty.gap);
  if (sty.color) css.color = resolveColor(sty.color);
  if (sty.bg) css.background = resolveColor(sty.bg);
  if (sty.borderColor) css.border = `1px solid ${resolveColor(sty.borderColor)}`;
  if (sty.radius) css.borderRadius = sty.radius === 'sm' ? 4 : 8;
  if (sty.font) css.fontSize = FONT_VARS[sty.font];
  if (sty.em !== undefined) css.fontSize = `${sty.em}em`;
  if (sty.fontRem !== undefined) css.fontSize = `${sty.fontRem}rem`;
  if (sty.maxwRem !== undefined) css.maxWidth = `${sty.maxwRem}rem`;
  if (sty.wch !== undefined) {
    css.display = 'inline-block';
    css.width = `${sty.wch}ch`;
  }
  if (sty.maxwCh !== undefined) css.maxWidth = `${sty.maxwCh}ch`;
  if (sty.accentBorder) css.borderInlineStart = `3px solid ${resolveColor(sty.accentBorder)}`;
  if (sty.lh !== undefined) css.lineHeight = sty.lh;
  if (sty.minhEm !== undefined) css.minHeight = `${sty.minhEm}em`;
  if (sty.mono) css.fontFamily = 'var(--font-mono, ui-monospace, monospace)';
  if (sty.bold) css.fontWeight = 600;
  if (sty.tabular) css.fontVariantNumeric = 'tabular-nums';
  if (sty.nowrap) css.whiteSpace = 'nowrap';
  if (sty.align) css.textAlign = sty.align;
  if (sty.deco === 'underlineDotted') {
    css.textDecoration = 'underline dotted';
    css.cursor = 'help';
  }
  return css;
}
