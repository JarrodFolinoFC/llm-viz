import { useMemo } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';

import { AppIcon } from './AppIcon';
import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';
import styles from './ClickableIcon.module.css';

export interface ClickableIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Forwarded to the underlying button, composed with the hint ref (so wrapping
   *  in a Tooltip/Popover doesn't displace the hint registration). */
  ref?: Ref<HTMLButtonElement>;
  /** Manifest / antd icon name to render (via {@link AppIcon}). Ignored when
   *  `children` are given. */
  icon?: string;
  /** Custom icon node, if `icon` isn't enough. */
  children?: ReactNode;
  /** Accessible label — required, since an icon button has no text. */
  label: string;
  /** Icon glyph size in px (default 20). */
  size?: number;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
}

/**
 * An icon-only button that integrates natively with the vim layer: while hint
 * mode is on (`f`) the glyph dims and its 2-letter label sits centred on top,
 * and typing the label clicks it — no reserved width, no floating chip. Give it
 * an `icon` name (rendered through {@link AppIcon}) or arbitrary `children`.
 */
export function ClickableIcon({ icon, children, label, size = 20, className, disabled, hintLabel, ref: outerRef, ...rest }: ClickableIconProps) {
  const { ref: hintRef, hint, active } = useVimHint({ disabled, label: hintLabel });
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  const classes = clsx(styles.iconButton, className);
  return (
    <button ref={setRef} type="button" aria-label={label} title={label} disabled={disabled} className={classes} {...rest}>
      <span className={styles.iconFrame}>
        <span className={clsx(styles.glyph, active && styles.dimGlyph)}>
          {children ?? (icon ? <AppIcon name={icon} style={{ fontSize: size }} /> : null)}
        </span>
        <VimHint hint={hint} placement="overlay" />
      </span>
    </button>
  );
}
