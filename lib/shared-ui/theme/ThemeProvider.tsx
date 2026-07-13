import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';

import { applyThemeVars, type ThemeMode } from './palette';
import { buildAntdTheme } from './antdTheme';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** Flip between light and dark. */
  toggle: () => void;
}

const DEFAULTS: ThemeContextValue = {
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
};

// A default-bearing context (rather than throwing) so components still render in
// tests / Storybook that don't mount the provider.
const Ctx = createContext<ThemeContextValue>(DEFAULTS);

export const useTheme = () => useContext(Ctx);

const COOKIE = 'theme';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/**
 * The shared light/dark theme provider for every jarrodfolino.com app. Owns just
 * the colour mode (persisted in the `theme` cookie), flips `data-theme` on <html>
 * before paint, and themes antd via {@link buildAntdTheme}. Apps that need extra
 * view settings (e.g. llm-trainer's panel size / precision) layer their own
 * context on top and reuse these same helpers.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (readCookie(COOKIE) === 'dark' ? 'dark' : 'light'),
  );

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  // Layout effect so the attribute flips before the browser paints (no flash
  // when a returning visitor had dark mode saved).
  useLayoutEffect(() => {
    applyThemeVars(mode);
  }, [mode]);

  useEffect(() => {
    writeCookie(COOKIE, mode);
  }, [mode]);

  return (
    <Ctx.Provider value={{ mode, setMode, toggle }}>
      <ConfigProvider theme={buildAntdTheme(mode)}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </Ctx.Provider>
  );
}
