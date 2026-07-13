import { useCallback, useMemo } from 'react';
import type { Ref } from 'react';
import { Checkbox as AntdCheckbox } from 'antd';
import type { CheckboxProps as AntdCheckboxProps, GetRef } from 'antd';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';
import styles from './Checkbox.module.css';

export type CheckboxProps = AntdCheckboxProps & {
  /** Forwarded to antd's Checkbox, composed with the hint ref (so wrapping in a
   *  Tooltip/Popover doesn't displace the hint registration). */
  ref?: Ref<GetRef<typeof AntdCheckbox>>;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

type CheckboxRef = GetRef<typeof AntdCheckbox>;

/**
 * antd's `Checkbox` with the vim layer designed in. The box is enlarged a touch
 * so that, in hint mode, its 2-letter label sits centred *inside* the box (the
 * fill/check neutralised underneath) — typing the label toggles it. No reserved
 * width, so it drops into dense rows unchanged.
 *
 * The hint registers the `.ant-checkbox-wrapper` (the element the layer would
 * otherwise DOM-scan), so it's excluded from the scan and never double-hinted.
 */
export function Checkbox({ className, disabled, children, hintLabel, ref: outerRef, ...rest }: CheckboxProps) {
  const { ref, hint, active } = useVimHint({ disabled: !!disabled, label: hintLabel });
  // antd's Checkbox ref is a handle, not a DOM node — reach the wrapping label
  // (the scanned target) from its input, and register that as the hint element.
  const hintRef = useCallback(
    (node: CheckboxRef | null) => {
      const input = node?.input ?? null;
      ref(input ? input.closest<HTMLElement>('.ant-checkbox-wrapper') : null);
    },
    [ref],
  );
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  const classes = clsx(styles.hintable, active && styles.dim, className);
  return (
    <AntdCheckbox ref={setRef} disabled={disabled} className={classes} {...rest}>
      {/* The label overlay is pinned over the box (not the whole wrapper). */}
      <span className={styles.boxHint}>
        <VimHint hint={hint} placement="overlay" />
      </span>
      {children}
    </AntdCheckbox>
  );
}
