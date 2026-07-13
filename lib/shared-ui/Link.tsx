import { useMemo } from 'react';
import type { ComponentPropsWithRef } from 'react';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { hintWord } from './vim/hintWord';
import { VimHint } from './vim/VimHint';
import styles from './Link.module.css';

export type LinkProps = ComponentPropsWithRef<'a'> & {
  /** Force the vim `f` hint label instead of the auto mnemonic; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * A theme-aware anchor that integrates natively with the vim layer: while hint
 * mode is on (`f`) its label sits in the space to the left of the link, in the
 * link's own colour, and navigates (clicks itself) when the label is typed.
 *
 * The label is a mnemonic derived from the link's own text (e.g. "Docs" → `do`),
 * so it's memorable; when several links share the same code the layer appends a
 * number (`do`, `do2`, …). It's a plain `<a>`, so it works with any router that
 * intercepts anchor clicks (pass `href`/`onClick`) and for cross-origin links.
 */
export function Link({ className, children, hintLabel, ref: outerRef, ...rest }: LinkProps) {
  // A 2-letter mnemonic from the link text, when it's a plain string — unless the
  // caller forces a label.
  const label =
    hintLabel ?? (typeof children === 'string' ? hintWord(children).slice(0, 2) || undefined : undefined);
  const { ref: hintRef, hint } = useVimHint({ label });
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  const classes = clsx(styles.link, className);
  return (
    <a ref={setRef} className={classes} {...rest}>
      <VimHint hint={hint} placement="slot" />
      {children}
    </a>
  );
}
