import { useEffect, useState, type ReactNode } from 'react';
import { Flex, Modal, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { VimLayer } from 'vimium-layer';

import { Segmented } from './Segmented';
import { useSensitive } from './sensitive';
import { useTheme } from './theme/ThemeProvider';
import type { ThemeMode } from './theme/palette';

export interface SettingsProps {
  /** The letter pressed with Ctrl to toggle the panel (default `s`). Ctrl only
   *  (not Cmd), matching the QuickReminders convention. */
  hotkey?: string;
  /**
   * Drive the Appearance control from the app's own theme state instead of the
   * shared {@link ThemeProvider} — for apps with their own settings context
   * (llm-trainer). Both must be given together.
   */
  mode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  /** App-specific settings sections, rendered below the base controls. */
  children?: ReactNode;
}

/**
 * The app-wide settings panel, opened with Ctrl+S from anywhere. Part of the
 * shared `mountApp` chrome, so every first-party app gets it for free (the
 * vendored `third_party/*` apps compose their own root and so don't; llm-trainer
 * mounts it itself with its view options as children). The base holds the
 * light/dark theme; apps append their own sections via `children`.
 *
 * Like QuickReminders it mounts its own {@link VimLayer} while open, so the
 * panel's controls are vim-hintable and it owns the keyboard until it closes.
 */
export function Settings({ hotkey = 's', mode: modeProp, onModeChange, children }: SettingsProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const mode = modeProp ?? theme.mode;
  const setMode = onModeChange ?? theme.setMode;
  // Global "Hide sensitive information" — only shown when a SensitiveProvider is
  // actually mounted (the standard mountApp chrome has one; an app with its own
  // root, like llm-trainer, doesn't, so the row would be a no-op there).
  const sensitive = useSensitive();

  // Global hotkey to toggle the panel: Ctrl only (not Cmd), so ⌘S stays free and
  // Ctrl-S opens this instead of the browser's "save page".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey]);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      destroyOnHidden
      width={460}
      style={{ top: 80 }}
      title={
        <Flex align="center" gap={8}>
          <SettingOutlined /> Settings
        </Flex>
      }
    >
      {/* Mounted only while open, so it owns the keyboard for hint mode and hands
          back to the host app's layer on close. */}
      <VimLayer />
      <Flex align="center" justify="space-between" gap="middle" style={{ paddingTop: 4 }}>
        <div>
          <Typography.Text strong>Appearance</Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Light or dark colour theme
            </Typography.Text>
          </div>
        </div>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as ThemeMode)}
          options={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </Flex>
      {sensitive.available && (
        <Flex align="center" justify="space-between" gap="middle" style={{ paddingTop: 16 }}>
          <div>
            <Typography.Text strong>Privacy</Typography.Text>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Blur financial figures and other sensitive data
              </Typography.Text>
            </div>
          </div>
          <Segmented
            value={sensitive.hidden ? 'hide' : 'show'}
            onChange={(v) => sensitive.setHidden(v === 'hide')}
            options={[
              { label: 'Show', value: 'show' },
              { label: 'Hide', value: 'hide' },
            ]}
          />
        </Flex>
      )}
      {children}
    </Modal>
  );
}
