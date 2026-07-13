import { useMemo } from 'react';
import type { Ref } from 'react';
import { Button as AntdButton } from 'antd';
import type { ButtonProps as AntdButtonProps, GetRef } from 'antd';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';
import styles from './Button.module.css';

export interface ButtonProps extends AntdButtonProps {
  /** Put the 2-letter hint *over the icon* (hiding the glyph, framing the space)
   *  instead of in a leading slot — even when the button also has a text label.
   *  For icon-led controls where the glyph is the natural anchor. */
  hintOnIcon?: boolean;
  /** Put the 2-letter hint in a reserved slot *after* the icon (to its right),
   *  with the glyph left intact — instead of overlaying it. For icon-only
   *  buttons (e.g. the ⋮ action menu) where the label reads better beside the
   *  glyph than centred on top of it. */
  hintTrailing?: boolean;
  /** Force the vim `f` hint label for this control (e.g. `"gh"`) instead of an
   *  auto-assigned one. Must be unique on the page — duplicate declared labels
   *  are numbered (`"gh"`→`"gh1"`/`"gh2"`) so the chosen keys stop applying; the
   *  hint-uniqueness checker (tools/check-hints) flags collisions. */
  hintLabel?: string;
  /** Forwarded to antd's Button, composed with the hint ref (so wrapping in a
   *  Tooltip/Popover doesn't displace the hint registration). */
  ref?: Ref<GetRef<typeof AntdButton>>;
}

/**
 * antd's `Button`, wrapped so the vim layer is designed *into* it. Icon-only
 * buttons (and `hintOnIcon` ones) hide the glyph's interior and centre the 2
 * letters inside an outline frame, so the label reads as the icon; text buttons
 * get a reserved-but-invisible leading slot. Typing the label clicks it — no
 * floating chip. A near-drop-in for antd's Button: swap
 * `import { Button } from 'antd'` for `from 'shared-ui'`.
 */
export function Button({ className, disabled, icon, loading, children, hintOnIcon, hintTrailing, hintLabel, ref: outerRef, ...rest }: ButtonProps) {
  const { ref: hintRef, hint, active } = useVimHint({ disabled: !!disabled, label: hintLabel });
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  // Overlay the icon when there's no text, or when the caller asks for it — but
  // `hintTrailing` opts out, keeping the glyph and putting the label beside it.
  const onIcon = icon != null && (children == null || hintOnIcon) && !hintTrailing;
  const classes = clsx(styles.hintable, className);
  return (
    <AntdButton ref={setRef} disabled={disabled} loading={loading} className={classes} {...rest}>
      {onIcon ? (
        <>
          <span className={styles.iconFrame}>
            {/* Keep the icon's own shape visible (faded) so you still recognise
                what you're triggering; the letters sit inside it. */}
            <span className={clsx(styles.glyph, active && styles.dimGlyph)}>
              {!loading && icon}
            </span>
            <VimHint hint={hint} placement="overlay" />
          </span>
          {children}
        </>
      ) : (
        <>
          {/* Reserved-but-invisible slot: leads a text button, or trails the glyph
              when `hintTrailing`. antd owns the loading spinner. */}
          {!hintTrailing && <VimHint hint={hint} placement="slot" />}
          {!loading && icon}
          {children}
          {hintTrailing && <VimHint hint={hint} placement="slot-end" />}
        </>
      )}
    </AntdButton>
  );
}
