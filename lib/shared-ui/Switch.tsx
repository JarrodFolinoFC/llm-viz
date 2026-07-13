import { useCallback } from 'react';
import { Switch as AntdSwitch } from 'antd';
import type { SwitchProps as AntdSwitchProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { VimHint } from './vim/VimHint';
import styles from './Switch.module.css';

export type SwitchProps = AntdSwitchProps & {
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * antd's `Switch` with the vim layer designed in: in hint mode the switch hides
 * and its 2-letter label sits inside an outline frame, and typing the label
 * toggles it — instead of the layer floating a chip over it.
 */
export function Switch({ className, disabled, hintLabel, ...rest }: SwitchProps) {
  const { ref, hint, active } = useVimHint({ disabled: !!disabled, label: hintLabel });
  // Register the antd switch's own <button> (the element the layer would scan),
  // so it's excluded from the scan and never double-hinted.
  const setRef = useCallback(
    (node: HTMLSpanElement | null) => {
      ref(node ? node.querySelector<HTMLElement>('button.ant-switch') : null);
    },
    [ref],
  );
  return (
    <span ref={setRef} className={styles.wrap}>
      <span className={active ? styles.dim : undefined}>
        <AntdSwitch disabled={disabled} className={className} {...rest} />
      </span>
      <VimHint hint={hint} placement="overlay" />
    </span>
  );
}
