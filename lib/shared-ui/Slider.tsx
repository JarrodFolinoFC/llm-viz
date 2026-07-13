import { useCallback, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import { Slider as AntdSlider } from 'antd';
import type { SliderSingleProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';

export type SliderProps = SliderSingleProps & {
  /** Composed with the hint ref onto the wrapper (so wrapping in a Tooltip/Popover
   *  doesn't displace the hint registration — see {@link ButtonProps.ref}). */
  ref?: Ref<HTMLSpanElement>;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * antd's `Slider` (single-value) with the vim layer designed in: the rail isn't
 * a DOM-scan target, so without this it's mouse-only in hint mode. Typing its
 * corner label focuses the handle — then ←/→ step the value (antd's own
 * keyboard model, one `step` per press). A near-drop-in for antd's `Slider`
 * (same min/max/step/value/onChange API).
 */
export function Slider({ disabled, hintLabel, ref: outerRef, ...rest }: SliderProps) {
  const handleEl = useRef<HTMLElement | null>(null);
  const { ref, hint, active } = useVimHint({
    disabled: !!disabled,
    label: hintLabel,
    onActivate: () => handleEl.current?.focus(),
  });
  const hintRef = useCallback(
    (node: HTMLSpanElement | null) => {
      // Register the whole slider (rail + handle) as the hint's anchor; focus
      // goes to the handle (role="slider", tabindex=0 — antd's keyboard target).
      handleEl.current = node?.querySelector<HTMLElement>('.ant-slider-handle') ?? null;
      ref(node?.querySelector<HTMLElement>('.ant-slider') ?? null);
    },
    [ref],
  );
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  return (
    <span ref={setRef} style={{ position: 'relative', display: 'inline-flex', minWidth: 0 }}>
      <AntdSlider disabled={disabled} {...rest} />
      {active && <VimHint hint={hint} placement="corner" />}
    </span>
  );
}
