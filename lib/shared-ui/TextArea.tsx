import { useCallback, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import { Input as AntdInput } from 'antd';
import type { GetProps } from 'antd';
import { useVimHint } from 'vimium-layer';

import { composeRefs } from './vim/composeRefs';
import { VimHint } from './vim/VimHint';

export type TextAreaProps = Omit<GetProps<typeof AntdInput.TextArea>, 'ref'> & {
  /** Composed with the hint ref onto the wrapper (so wrapping in a Tooltip/Popover
   *  doesn't displace the hint registration — see {@link ButtonProps.ref}). */
  ref?: Ref<HTMLSpanElement>;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
};

/**
 * antd's `Input.TextArea` with the vim layer designed in: in hint mode a corner
 * badge floats the field's 2-letter label, and typing it focuses the textarea —
 * ready to type (or Ctrl+I into the MiniVim editor, exactly like any focused
 * editable). A near-drop-in for `Input.TextArea`.
 *
 * The wrapper registers the inner `<textarea>` (the element the layer would
 * otherwise DOM-scan), so it's excluded from the scan and never double-hinted.
 */
export function TextArea({ disabled, hintLabel, ref: outerRef, ...rest }: TextAreaProps) {
  const areaEl = useRef<HTMLTextAreaElement | null>(null);
  const { ref, hint, active } = useVimHint({
    disabled: !!disabled,
    label: hintLabel,
    onActivate: () => areaEl.current?.focus(),
  });
  const hintRef = useCallback(
    (node: HTMLSpanElement | null) => {
      areaEl.current = node?.querySelector('textarea') ?? null;
      ref(areaEl.current);
    },
    [ref],
  );
  const setRef = useMemo(() => composeRefs(hintRef, outerRef), [hintRef, outerRef]);
  return (
    <span ref={setRef} style={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
      <AntdInput.TextArea disabled={disabled} {...rest} />
      {active && <VimHint hint={hint} placement="corner" />}
    </span>
  );
}
