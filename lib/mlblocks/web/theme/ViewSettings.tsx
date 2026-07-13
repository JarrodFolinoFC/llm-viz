import { createContext, useContext, useEffect, useLayoutEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { TrainerSettingsProvider } from '../../react/settings';
import {
  ViewOptionsProvider,
  PANEL_SIZES,
  ARRANGEMENTS,
  type PanelSize,
  type Arrangement,
} from '../../react/viewOptions';

export { PANEL_SIZES, ARRANGEMENTS };
export type { PanelSize, Arrangement };
import { PrimitivesContext } from '../../react/primitives/context';
import { webPrimitives } from '../primitives';

import {
  applyThemeVars,
  applyColorOverrides,
  buildAntdTheme,
  EMPTY_OVERRIDES,
  type ThemeMode,
  type ColorOverrides,
  type VarName,
} from 'shared-ui';

import { PRECISION, PRECISIONS, type Precision } from '../../core/precision';
import { setActivePrecision } from '../../core/activePrecision';
import { useCookieState, usePersistentState } from '../lib/useCookieState';
import { readCookie, writeCookie } from '../lib/cookie';

/** A valid `?p=` precision from the current URL, or null. Lets a shared training
 *  link pin its decimal precision (which is part of a reproducible run) ahead of
 *  the saved cookie — read at provider init, before any trainer mounts. */
const precisionFromUrl = (): Precision | null => {
  if (typeof window === 'undefined') return null;
  const v = Number(new URLSearchParams(window.location.search).get('p'));
  return (PRECISIONS as number[]).includes(v) ? (v as Precision) : null;
};

export interface ViewSettings {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  panelSize: PanelSize;
  setPanelSize: (s: PanelSize) => void;
  /** How the flow panels are arranged (stage rows / collapsed / one per row). */
  arrangement: Arrangement;
  setArrangement: (a: Arrangement) => void;
  /** Hide the connector arrows between flow panels (more room for the data). */
  hideArrows: boolean;
  setHideArrows: (hide: boolean) => void;
  /** Hide the per-row "JS" buttons and the per-panel copy-as-markdown buttons. */
  hideActions: boolean;
  setHideActions: (hide: boolean) => void;
  /** Decimal places shown for every numeric readout across the app. */
  precision: Precision;
  setPrecision: (p: Precision) => void;
  /** User overrides for the colour-token palette, kept per theme mode. */
  colorOverrides: ColorOverrides;
  /** Override one token's colour for the *current* mode. */
  setTokenColor: (name: VarName, hex: string) => void;
  /** Drop one token's override for the current mode (revert to the theme default). */
  resetTokenColor: (name: VarName) => void;
  /** Drop every token override for the current mode. */
  resetTokenColors: () => void;
}

const DEFAULTS: ViewSettings = {
  mode: 'light',
  setMode: () => {},
  panelSize: 'm',
  setPanelSize: () => {},
  arrangement: 'stage',
  setArrangement: () => {},
  hideArrows: false,
  setHideArrows: () => {},
  hideActions: false,
  setHideActions: () => {},
  precision: PRECISION,
  setPrecision: () => {},
  colorOverrides: EMPTY_OVERRIDES,
  setTokenColor: () => {},
  resetTokenColor: () => {},
  resetTokenColors: () => {},
};

// A default-bearing context (rather than throwing) so Panels still render in
// Storybook / tests that don't mount the provider.
const Ctx = createContext<ViewSettings>(DEFAULTS);

export const useViewSettings = () => useContext(Ctx);

/** '1'/'0' cookie codec for the boolean settings. */
const parseFlag = (raw: string | null) => raw === '1';
const serializeFlag = (v: boolean) => (v ? '1' : '0');

export function ViewSettingsProvider({ children }: { children: ReactNode }) {
  // Every setting is a cookie-backed state: lazily read on mount, written back
  // on change (the persist effect lives once inside useCookieState).
  const [mode, setMode] = useCookieState<ThemeMode>(
    'theme',
    (raw) => (raw === 'dark' ? 'dark' : 'light'),
    (m) => m,
  );
  const [panelSize, setPanelSize] = useCookieState<PanelSize>(
    'panelSize',
    (raw) => {
      if (raw && (PANEL_SIZES as string[]).includes(raw)) return raw as PanelSize;
      // No saved preference: start extra-compact on phones (fit more on screen),
      // medium elsewhere.
      const isPhone =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 991px)').matches;
      return isPhone ? 'xs' : 'm';
    },
    (s) => s,
  );
  const [arrangement, setArrangement] = useCookieState<Arrangement>(
    'arrangement',
    (raw) => {
      if (raw && (ARRANGEMENTS as string[]).includes(raw)) return raw as Arrangement;
      // No saved preference: one-per-row on phones (the panels are too wide to
      // sit side by side), the continuous wrapping flow elsewhere — desktop
      // fills each line with panels and wraps instead of scrolling sideways.
      const isPhone =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 991px)').matches;
      return isPhone ? 'vertical' : 'collapsed';
    },
    (a) => a,
  );
  const [hideArrows, setHideArrows] = useCookieState('hideArrows', parseFlag, serializeFlag);
  const [hideActions, setHideActions] = useCookieState('hideActions', parseFlag, serializeFlag);
  const [precision, setPrecision] = usePersistentState<Precision>(
    () => {
      // A `?p=` in the URL wins over the cookie so a shared training link
      // reproduces its precision; otherwise fall back to the saved cookie.
      const fromUrl = precisionFromUrl();
      if (fromUrl !== null) return fromUrl;
      const v = Number(readCookie('precision'));
      return (PRECISIONS as number[]).includes(v) ? (v as Precision) : PRECISION;
    },
    (v) => writeCookie('precision', String(v)),
  );
  const [colorOverrides, setColorOverrides] = useCookieState<ColorOverrides>(
    'colorOverrides',
    (raw) => {
      if (!raw) return { light: {}, dark: {} };
      try {
        const parsed = JSON.parse(raw) as Partial<ColorOverrides>;
        return { light: parsed.light ?? {}, dark: parsed.dark ?? {} };
      } catch {
        return { light: {}, dark: {} };
      }
    },
    JSON.stringify,
  );

  const setTokenColor = (name: VarName, hex: string) =>
    setColorOverrides((prev) => ({ ...prev, [mode]: { ...prev[mode], [name]: hex } }));
  const resetTokenColor = (name: VarName) =>
    setColorOverrides((prev) => {
      const next = { ...prev[mode] };
      delete next[name];
      return { ...prev, [mode]: next };
    });
  const resetTokenColors = () => setColorOverrides((prev) => ({ ...prev, [mode]: {} }));

  // Layout effect so the attribute flips before the browser paints (no flash
  // when a returning visitor had dark mode saved).
  useLayoutEffect(() => {
    applyThemeVars(mode);
  }, [mode]);

  // Re-apply the palette overrides whenever the mode or the overrides change
  // (also before paint, so a returning visitor's custom colours don't flash).
  useLayoutEffect(() => {
    applyColorOverrides(mode, colorOverrides);
  }, [mode, colorOverrides]);

  // Mirror the precision into the module variable the non-React formatters read.
  useEffect(() => {
    setActivePrecision(precision);
  }, [precision]);

  // Bridge the platform-free slices into mlblocks' contexts — the display
  // components (NumericCell etc.) read precision from TrainerSettings, the
  // headless components read panel size / arrangement / chrome toggles from
  // ViewOptions. Neither ever touches this web provider directly. (The trainer
  // takes precision as a constructor argument via useUrlSyncedStepTrainer, not
  // through this context.)
  const trainerSettings = useMemo(() => ({ precision }), [precision]);
  const viewOptions = useMemo(
    () => ({ panelSize, arrangement, hideArrows, hideActions }),
    [panelSize, arrangement, hideArrows, hideActions],
  );

  return (
    // The web renderer rides along: mounting ViewSettings IS choosing the web
    // platform, so the primitives context comes with it — tests and stories
    // that wrap in ViewSettingsProvider get a complete web environment.
    <PrimitivesContext.Provider value={webPrimitives}>
      <Ctx.Provider value={{ mode, setMode, panelSize, setPanelSize, arrangement, setArrangement, hideArrows, setHideArrows, hideActions, setHideActions, precision, setPrecision, colorOverrides, setTokenColor, resetTokenColor, resetTokenColors }}>
        <TrainerSettingsProvider value={trainerSettings}>
          <ViewOptionsProvider value={viewOptions}>
            <ConfigProvider theme={buildAntdTheme(mode)}>
              <AntdApp>{children}</AntdApp>
            </ConfigProvider>
          </ViewOptionsProvider>
        </TrainerSettingsProvider>
      </Ctx.Provider>
    </PrimitivesContext.Provider>
  );
}
