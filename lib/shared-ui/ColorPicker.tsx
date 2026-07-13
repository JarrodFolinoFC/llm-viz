import { useCallback, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import { ColorPicker as AntdColorPicker } from 'antd';
import type { ColorPickerProps as AntdColorPickerProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';

export type ColorPickerProps = AntdColorPickerProps & {
  /** Composed with the hint ref onto the wrapper (so wrapping in a Tooltip/Popover
   *  doesn't displace the hint registration — see {@link ButtonProps.ref}). */
  ref?: Ref<HTMLSpanElement>;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * antd's `ColorPicker` with the vim layer designed in: the swatch trigger is a
 * plain div (no button role), so without this it's mouse-only in hint mode.
 * Typing its corner label clicks the trigger, opening the picker popup — the
 * popup itself stays antd's (its hex field is a real input the layer can reach).
 * A near-drop-in for antd's `ColorPicker` (same value/onChange/format API).
 */
export function ColorPicker({ disabled, hintLabel, ref: outerRef, ...rest }: ColorPickerProps) {
  const triggerEl = useRef<HTMLElement | null>(null);
  const { ref, hint, active } = useVimHint({
    disabled: !!disabled,
    label: hintLabel,
    onActivate: () => triggerEl.current?.click(),
  });
  const hintRef = useCallback(
    (node: HTMLSpanElement | null) => {
      triggerEl.current = node?.querySelector<HTMLElement>('.ant-color-picker-trigger') ?? null;
      ref(triggerEl.current);
    },
    [ref],
  );
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  return (
    <span ref={setRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <AntdColorPicker disabled={disabled} {...rest} />
      {active && <VimHint hint={hint} placement="corner" />}
    </span>
  );
}
