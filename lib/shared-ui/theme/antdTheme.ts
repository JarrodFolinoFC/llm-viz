import { theme as antdAlgorithms } from 'antd';
import type { ThemeConfig } from 'antd';

import { resolveThemeColors, type ThemeMode } from './palette';

// antd derives hover/active shades from its palette in JS, so it needs concrete
// hex (not the app's `var(--c-…)` tokens) plus the matching light/dark
// algorithm. We resolve the palette for the active mode and hand antd real
// values; numeric px for radius/fontSize match what tokens.ts uses elsewhere.
export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  const c = resolveThemeColors(mode);
  return {
    algorithm: mode === 'dark' ? antdAlgorithms.darkAlgorithm : antdAlgorithms.defaultAlgorithm,
    token: {
      colorPrimary: c['highlight'],
      colorSuccess: c['success-fg'],
      colorWarning: c['warning-fg'],
      colorError: c['error-fg'],
      colorInfo: c['info-fg'],
      colorText: c['text-primary'],
      colorTextSecondary: c['text-secondary'],
      colorBgContainer: c['bg-page'],
      colorBgLayout: c['bg-surface'],
      colorBorder: c['border-default'],
      borderRadius: 4,
      fontSize: 16,
    },
  };
}

/** Backwards-compatible light theme for any non-themed entry points. */
export const antdTheme = buildAntdTheme('light');
