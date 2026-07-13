import { forwardRef, useCallback, useRef } from 'react';
import { Input as AntdInput } from 'antd';
import type { InputProps as AntdInputProps, InputRef } from 'antd';
import { useVimHint } from 'vimium-layer';

import { VimHint } from './vim/VimHint';

export type InputProps = AntdInputProps & {
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * antd's `Input` with the vim layer designed in: instead of the layer floating a
 * chip over the field, the hint label lives *inline in the field's prefix slot* —
 * a reserved-but-invisible keycap ahead of the text (and ahead of any caller
 * `prefix`), lit with the 2-letter label in hint mode. Typing it focuses the
 * input, ready to type; the value is never touched. A near-drop-in for antd's
 * `Input`.
 *
 * Forwards antd's `InputRef` (focus/blur/select …), so callers that drive the
 * field imperatively — e.g. an inline editor focusing it on open — keep working.
 */
export const Input = forwardRef<InputRef, InputProps>(function Input(
  { disabled, hintLabel, prefix, ...rest },
  forwardedRef,
) {
  const inputEl = useRef<HTMLInputElement | null>(null);
  const { ref, hint } = useVimHint({
    disabled: !!disabled,
    label: hintLabel,
    // A bare click doesn't focus a text field the way the layer's own input
    // handling does — focus it explicitly so you can start typing.
    onActivate: () => inputEl.current?.focus(),
  });
  // antd's Input ref is a handle, not a DOM node — register its inner <input>
  // (the element the layer would otherwise scan) so it's excluded and never
  // double-hinted, and pass the handle on to the caller's ref.
  const setRef = useCallback(
    (node: InputRef | null) => {
      inputEl.current = node?.input ?? null;
      ref(inputEl.current);
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [ref, forwardedRef],
  );
  return (
    <AntdInput
      ref={setRef}
      disabled={disabled}
      prefix={
        <>
          <VimHint hint={hint} placement="slot" />
          {prefix}
        </>
      }
      {...rest}
    />
  );
});
