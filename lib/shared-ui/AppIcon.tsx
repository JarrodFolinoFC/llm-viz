import type { ComponentType, CSSProperties, MouseEventHandler } from 'react';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';
import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  BuildOutlined,
  CalendarOutlined,
  ChromeOutlined,
  CloudUploadOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FundOutlined,
  GiftOutlined,
  HistoryOutlined,
  HomeOutlined,
  InteractionOutlined,
  NodeIndexOutlined,
  PictureOutlined,
  ReadOutlined,
  SolutionOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import { VimHint } from './vim/VimHint';
import styles from './AppIcon.module.css';

type IconCmp = ComponentType<{ style?: CSSProperties; className?: string }>;

// Resolve the manifest's `icon` string (an antd component name) to the actual
// component. The same names drive the generated favicons and the home tiles, so
// an app's tab icon, home tile and header badge always match. Add an entry here
// when a manifest entry uses a new icon.
const ICONS: Record<string, IconCmp> = {
  HomeOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  ExperimentOutlined,
  BellOutlined,
  GiftOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  FundOutlined,
  CloudUploadOutlined,
  CustomerServiceOutlined,
  HistoryOutlined,
  InteractionOutlined,
  ReadOutlined,
  DownloadOutlined,
  SolutionOutlined,
  TrophyOutlined,
  NodeIndexOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  BuildOutlined,
  BookOutlined,
  PictureOutlined,
  ChromeOutlined,
};

export interface AppIconProps {
  /** antd icon component name from the manifest (e.g. "BellOutlined"). */
  name: string;
  style?: CSSProperties;
  className?: string;
  /** Make the icon an interactive button — click handler. Gives it a native vim
   *  hint. Provide `label` for accessibility. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Make the icon a link. Gives it a native vim hint. Provide `label`. */
  href?: string;
  /** Accessible label when interactive (an icon has no text of its own). */
  label?: string;
  /** Force the vim `f` hint label instead of auto-assigning one (interactive
   *  only); must be unique on the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
}

/**
 * Render a manifest icon by name (falls back to a generic app glyph).
 *
 * Decorative by default — just the glyph. Pass `onClick` or `href` to make it an
 * interactive target that integrates natively with the vim layer: while hint
 * mode is on (`f`) it paints its own label in the corner and activates when the
 * label is typed, instead of the layer overlaying a floating chip.
 */
export function AppIcon({ name, style, className, onClick, href, label, hintLabel }: AppIconProps) {
  const Cmp = ICONS[name] ?? AppstoreOutlined;
  const interactive = onClick != null || href != null;
  // Hook is always called (rules of hooks); it no-ops while decorative.
  const { ref, hint, active } = useVimHint({ disabled: !interactive, label: hintLabel });
  const glyph = <Cmp style={style} className={className} />;

  if (!interactive) return glyph;

  // Icon-only: hide the glyph interior and centre the 2-letter label in an
  // outline frame in hint mode, so it reads as the icon.
  const body = (
    <span className={styles.iconFrame}>
      <span className={clsx(styles.glyph, active && styles.dimGlyph)}>{glyph}</span>
      <VimHint hint={hint} placement="overlay" />
    </span>
  );

  if (href != null) {
    return (
      <a ref={ref} href={href} aria-label={label} title={label} className={styles.interactive}>
        {body}
      </a>
    );
  }
  return (
    <button ref={ref} type="button" onClick={onClick} aria-label={label} title={label} className={styles.interactive}>
      {body}
    </button>
  );
}
