// The app's theme barrel. Everything generic now lives in shared-ui (tokens,
// antd theme builders, media hooks) and mlblocks (ViewSettings + view options);
// this file re-exports those single sources plus the app's own bits — the
// heatmap `viz` scheme and the MLP-only appSettings.
export {
  color,
  applyThemeVars,
  applyColorOverrides,
  resolveThemeColors,
  VARS,
  VAR_NAMES,
  EMPTY_OVERRIDES,
  space,
  radius,
  breakpoints,
  MOBILE_MAX,
  font,
  ensureDesignTokens,
  antdTheme,
  buildAntdTheme,
  useMediaQuery,
  useIsMobile,
} from 'shared-ui';
export type { ThemeMode, VarName, ColorOverrides } from 'shared-ui';

export {
  ViewSettingsProvider,
  useViewSettings,
  PANEL_SIZES,
  ARRANGEMENTS,
} from 'mlblocks';
export type { ViewSettings, PanelSize, Arrangement } from 'mlblocks';

export { useW1AllWords } from './appSettings';

/** The app's d3-free heatmap scheme names (matrix cells, strokes). */

