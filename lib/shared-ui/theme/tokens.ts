// The color tokens are theme-aware: each leaf is a `var(--c-…)` reference whose
// concrete value is supplied by the injected stylesheet keyed on `data-theme`.
// Defined in ./palette so the light/dark hex pairs live in one place.
export {
  color,
  applyThemeVars,
  applyColorOverrides,
  resolveThemeColors,
  VARS,
  VAR_NAMES,
  EMPTY_OVERRIDES,
} from './palette';
export type { ThemeMode, VarName, ColorOverrides } from './palette';

export const space = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  xxl: '2.5rem',
} as const;

export const radius = {
  sm: '4px',
} as const;

// Mobile-first breakpoints (min-width). Base styles target the phone; these are
// the widths at which we progressively enhance toward tablet/desktop layouts.
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '992px',
} as const;

// Below this width the apps use their compact, single-column, drawer-nav layout.
export const MOBILE_MAX = 991;

export const font = {
  size: {
    sm: '0.85rem',
    md: '0.9rem',
    base: '1rem',
  },
  prose: '60ch',
} as const;

// ── Design-token CSS variables ───────────────────────────────────────────────
// The spacing / radius / typography scales above are the single source of truth.
// Mirror them into `:root` as CSS custom properties so the *.module.css files can
// reference the very same scale (e.g. `padding: var(--space-md)`) instead of
// hardcoding pixel values. Unlike colors these don't vary by theme, so one
// static `:root` block is enough.
const DESIGN_TOKENS_STYLE_ID = 'design-tokens';

export function ensureDesignTokens() {
  if (typeof document === 'undefined' || document.getElementById(DESIGN_TOKENS_STYLE_ID)) return;
  const decls = [
    ...Object.entries(space).map(([k, v]) => `--space-${k}:${v};`),
    ...Object.entries(radius).map(([k, v]) => `--radius-${k}:${v};`),
    ...Object.entries(font.size).map(([k, v]) => `--font-size-${k}:${v};`),
    `--font-prose:${font.prose};`,
  ].join('');
  const el = document.createElement('style');
  el.id = DESIGN_TOKENS_STYLE_ID;
  el.textContent = `:root{${decls}}`;
  document.head.appendChild(el);
}

// Inject at module load so the variables resolve on the first paint.
ensureDesignTokens();
