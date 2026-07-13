import type { ReactNode } from 'react';

import { ViewSettingsProvider } from './theme/ViewSettings';

/**
 * The web composition root. Today this is exactly ViewSettingsProvider (which
 * mounts the web primitives, the cookie-backed settings, the TrainerSettings
 * bridge, and antd's ConfigProvider) — but consumers should wrap in
 * MLBlocksProvider, so the composition can grow without touching app roots.
 */
export function MLBlocksProvider({ children }: { children: ReactNode }) {
  return <ViewSettingsProvider>{children}</ViewSettingsProvider>;
}
