import type { CSSProperties, ReactNode } from 'react';
import { Card } from 'antd';
import clsx from 'clsx';

import styles from './Panel.module.css';

/** Compactness of a panel — drives title-bar height, padding and font size. */
export type PanelSize = 'xxs' | 'xs' | 's' | 'm' | 'l';

export const PANEL_SIZES: PanelSize[] = ['xxs', 'xs', 's', 'm', 'l'];

const SIZE_CLASS: Record<PanelSize, string> = {
  xxs: styles.sizeXxs,
  xs: styles.sizeXs,
  s: styles.sizeS,
  m: styles.sizeM,
  l: styles.sizeL,
};

export interface PanelProps {
  title?: ReactNode;
  /** Content rendered in the top-right of the title bar (antd Card `extra`). */
  extra?: ReactNode;
  /** Compactness; defaults to `m`. */
  size?: PanelSize;
  /** Fade + grey the panel out (e.g. an inactive step). */
  dimmed?: boolean;
  /** Extra class(es) merged onto the Card — e.g. layout overrides from a module. */
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * The shared card primitive: an antd `Card` with a fixed-height title bar and a
 * set of size variants. Theme-agnostic (colours come from the antd theme); import
 * the styles once in the host app via `import 'shared-ui/style.css'`.
 */
export function Panel({
  title,
  extra,
  size = 'm',
  dimmed = false,
  className,
  style,
  children,
}: PanelProps) {
  return (
    <Card
      className={clsx(styles.panel, SIZE_CLASS[size], dimmed && styles.dimmed, className)}
      size="small"
      title={title != null ? <span className={styles.titleBar}>{title}</span> : undefined}
      extra={extra}
      style={style}
      // Stable hook for styling/tests independent of the hashed CSS-module class.
      data-size={size}
    >
      <div>{children}</div>
    </Card>
  );
}
