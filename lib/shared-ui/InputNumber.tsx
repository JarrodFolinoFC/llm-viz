import { useCallback, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import { InputNumber as AntdInputNumber } from 'antd';
import type { InputNumberProps as AntdInputNumberProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';

type ValueType = string | number;

export type InputNumberProps<T extends ValueType = ValueType> = AntdInputNumberProps<T> & {
  /** Composed with the hint ref onto the wrapper (so wrapping in a Tooltip/Popover
   *  doesn't displace the hint registration — see {@link ButtonProps.ref}). */
  ref?: Ref<HTMLSpanElement>;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * antd's `InputNumber` with the vim layer designed in: in hint mode a corner
 * badge floats the field's 2-letter label, and typing it focuses the field —
 * ready to type a number or nudge with ↑/↓. A near-drop-in for antd's
 * `InputNumber` (same value/onChange/min/max/size API).
 *
 * The wrapper registers the inner `<input>` (the element the layer would
 * otherwise DOM-scan), so it's excluded from the scan and never double-hinted.
 */
export function InputNumber<T extends ValueType = ValueType>({
  disabled,
  hintLabel,
  ref: outerRef,
  ...rest
}: InputNumberProps<T>) {
  const inputEl = useRef<HTMLInputElement | null>(null);
  const { ref, hint, active } = useVimHint({
    disabled: !!disabled,
    label: hintLabel,
    onActivate: () => inputEl.current?.focus(),
  });
  const hintRef = useCallback(
    (node: HTMLSpanElement | null) => {
      inputEl.current = node?.querySelector<HTMLInputElement>('.ant-input-number-input') ?? null;
      ref(inputEl.current);
    },
    [ref],
  );
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  return (
    <span ref={setRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <AntdInputNumber disabled={disabled} {...rest} />
      {active && <VimHint hint={hint} placement="corner" />}
    </span>
  );
}
