import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';

import { useTheme } from './theme/ThemeProvider';

export type ThemeToggleProps = Omit<ButtonProps, 'onClick' | 'icon'>;

/**
 * A compact light/dark switch. Drop it into an app's chrome (e.g. AppShell's nav
 * footer); it reads and flips the shared {@link useTheme} mode. Shows the icon of
 * the mode you'd switch *to*.
 */
export function ThemeToggle({ type = 'text', shape = 'circle', ...rest }: ThemeToggleProps) {
  const { mode, toggle } = useTheme();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <Button
        type={type}
        shape={shape}
        aria-label={`Switch to ${next} mode`}
        icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggle}
        {...rest}
      />
    </Tooltip>
  );
}
