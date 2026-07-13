// The single source of truth for every themeable color. Each entry maps a
// CSS-variable name to its [light, dark] hex values. The app's components keep
// importing `color.*` (which now resolve to `var(--c-…)` strings), so switching
// themes is just a matter of flipping `data-theme` on <html> — no component
// needs to know which theme is active. antd is themed separately (it derives
// hover/active shades in JS and can't consume `var()`), via buildAntdTheme.

export type ThemeMode = 'light' | 'dark';

type Pair = readonly [light: string, dark: string];

// var-name (without the `--c-` prefix) → [light, dark]
export const VARS = {
  'text-primary':    ['#0f172a', '#e6e8ec'],
  'text-secondary':  ['#555555', '#9aa1ac'],
  'text-muted':      ['#9ca3af', '#6b7280'],
  'text-inverse':    ['#ffffff', '#0f172a'],
  'text-on-dark':    ['#e2e8f0', '#e2e8f0'],
  'text-emphasis':   ['#0c4a6e', '#7dd3fc'],

  'bg-page':         ['#ffffff', '#1f2430'],
  'bg-surface':      ['#fafafa', '#272d3a'],
  'bg-subtle':       ['#f6f8fa', '#2d3441'],
  'bg-disabled':     ['#e5e7eb', '#3a4150'],

  'border-default':  ['#dddddd', '#3a4150'],
  'border-emphasis': ['#000000', '#e6e8ec'],
  'border-strong':   ['#cccccc', '#4a5160'],

  'positive':        ['#22aa77', '#34d399'],
  'negative':        ['#dd3355', '#f87171'],
  // llm-trainer's "still the random init" badge state — live (green) panels
  // whose values SGD hasn't actually touched yet show this instead.
  'random-init':     ['#8b5cf6', '#a78bfa'],

  'info-fg':         ['#0369a1', '#38bdf8'],
  'info-bg':         ['#f0f9ff', '#1e2a3a'],
  'info-border':     ['#bae6fd', '#2c4a63'],

  // Anchors, for shared-ui's Link component. The values mirror what antd
  // *renders* for its own links (colorLink/colorLinkHover, derived by its
  // algorithms from the info-fg seed: light passes through, dark transforms
  // #38bdf8 → #33a4d6), so <a>s look the same whether they're shared-ui Links
  // or antd Typography.Links. Seeding antd's colorLink directly can't achieve
  // this — the dark algorithm re-derives whatever seed it's given — so the
  // measured outputs live here instead; re-measure if the antd major bumps.
  'link':            ['#0369a1', '#33a4d6'],
  'link-hover':      ['#0284c7', '#7dd3fc'],

  'warning-fg':      ['#92400e', '#fbbf24'],
  'warning-bg':      ['#fffbeb', '#33291a'],
  'warning-border':  ['#fcd34d', '#5c4715'],

  'success-fg':      ['#15803d', '#4ade80'],
  'success-bg':      ['#dcfce7', '#16301f'],
  'success-border':  ['#bbf7d0', '#236136'],

  'error-fg':        ['#b91c1c', '#f87171'],
  'error-bg':        ['#fee2e2', '#3a1d1d'],
  'error-border':    ['#fecaca', '#6b2b2b'],

  'highlight':       ['#f59e0b', '#fbbf24'],
  'emphasis':        ['#000000', '#e6e8ec'],
  'highlight-bg':    ['#fde68a', '#5c4715'],

  // Token chips. Their own tokens (defaulting to the info/amber families) so the
  // chip colour picker recolours only the chips, not everything else. (Kept here
  // so llm-trainer's token-highlight components share this one palette.)
  'chip-next-bg':    ['#bae6fd', '#2c4a63'],
  'chip-next-fg':    ['#0c4a6e', '#7dd3fc'],
  'chip-prev-bg':    ['#fde68a', '#5c4715'],
  'chip-prev-fg':    ['#92400e', '#fbbf24'],
} as const satisfies Record<string, Pair>;

export type VarName = keyof typeof VARS;

/** Every themeable token name, in declaration order. */
export const VAR_NAMES = Object.keys(VARS) as VarName[];

/** User overrides for the token palette, kept per theme mode. */
export type ColorOverrides = Record<ThemeMode, Partial<Record<VarName, string>>>;

export const EMPTY_OVERRIDES: ColorOverrides = { light: {}, dark: {} };

const v = (name: VarName) => `var(--c-${name})`;

/**
 * The color tokens consumers import. Every leaf is a `var(--c-…)` reference, so
 * the same object renders correctly under either theme — the active values live
 * in the injected stylesheet keyed by `data-theme`.
 */
export const color = {
  text: {
    primary: v('text-primary'),
    secondary: v('text-secondary'),
    muted: v('text-muted'),
    inverse: v('text-inverse'),
    onDark: v('text-on-dark'),
    emphasis: v('text-emphasis'),
  },
  bg: {
    page: v('bg-page'),
    surface: v('bg-surface'),
    subtle: v('bg-subtle'),
    disabled: v('bg-disabled'),
  },
  border: {
    default: v('border-default'),
    emphasis: v('border-emphasis'),
    strong: v('border-strong'),
  },
  positive: v('positive'),
  negative: v('negative'),
  randomInit: v('random-init'),
  info: { fg: v('info-fg'), bg: v('info-bg'), border: v('info-border') },
  link: v('link'),
  linkHover: v('link-hover'),
  warning: { fg: v('warning-fg'), bg: v('warning-bg'), border: v('warning-border') },
  success: { fg: v('success-fg'), bg: v('success-bg'), border: v('success-border') },
  error: { fg: v('error-fg'), bg: v('error-bg'), border: v('error-border') },
  highlight: v('highlight'),
  emphasis: v('emphasis'),
  highlightBg: v('highlight-bg'),
  /** Token-chip colours: prev (context) and next (target) highlights, shared by
   *  every token-highlight in the app so the chip colour picker recolours them all. */
  chip: {
    prevBg: v('chip-prev-bg'),
    prevFg: v('chip-prev-fg'),
    nextBg: v('chip-next-bg'),
    nextFg: v('chip-next-fg'),
  },
} as const;

/** Resolve every var to its concrete hex for the given mode (for antd / JS use). */
export function resolveThemeColors(mode: ThemeMode): Record<VarName, string> {
  const idx = mode === 'dark' ? 1 : 0;
  return Object.fromEntries(
    Object.entries(VARS).map(([k, pair]) => [k, pair[idx]]),
  ) as Record<VarName, string>;
}

const STYLE_ID = 'theme-vars';

/** Inject (once) a stylesheet that defines the light defaults and dark overrides. */
function ensureStylesheet() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const block = (idx: 0 | 1) =>
    Object.entries(VARS).map(([k, p]) => `--c-${k}:${p[idx]};`).join('');
  const css =
    `:root{${block(0)}color-scheme:light;}` +
    `:root[data-theme="dark"]{${block(1)}color-scheme:dark;}` +
    `body{background:var(--c-bg-page);}`;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

/** Apply a theme by flipping the `data-theme` attribute on <html>. */
export function applyThemeVars(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  ensureStylesheet();
  document.documentElement.setAttribute('data-theme', mode);
}

/**
 * Apply the user's per-token colour overrides for the active mode as inline
 * custom properties on <html> (which win over the themed stylesheet). Tokens not
 * overridden are cleared, so this also reverts edits and re-applies cleanly when
 * the mode flips — the override set is read fresh for whichever mode is active.
 */
export function applyColorOverrides(mode: ThemeMode, overrides: ColorOverrides) {
  if (typeof document === 'undefined') return;
  const active = overrides[mode] ?? {};
  const root = document.documentElement.style;
  for (const name of VAR_NAMES) {
    const hex = active[name];
    if (hex) root.setProperty(`--c-${name}`, hex);
    else root.removeProperty(`--c-${name}`);
  }
}

// Inject at module load so the light defaults resolve on the very first paint,
// before the provider's effect runs (avoids a frame of unresolved var() tokens).
ensureStylesheet();
