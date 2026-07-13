import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { Upload } from 'antd';
import type { UploadProps } from 'antd';
import clsx from 'clsx';
import { useVimHint } from 'vimium-layer';

import { VimHint } from './vim/VimHint';
import styles from './Dropzone.module.css';

export interface DropzoneProps extends Omit<UploadProps, 'children'> {
  /** Drop-area content — the icon/text shown inside the dashed zone. */
  children: ReactNode;
  /** Force the vim `f` hint label instead of auto-assigning one; must be unique on
   *  the page (see {@link ButtonProps.hintLabel}). */
  hintLabel?: string;
}

/**
 * antd's `Upload.Dragger` with the vim layer designed in. Instead of the layer
 * floating a chip over the drop area, hint mode fades the dropzone's contents and
 * centres its 2-letter label over them — typing the label opens the file picker,
 * matching the other native-hint controls (Button, Checkbox, …).
 *
 * antd renders the clickable target as `.ant-upload-btn` inside the dragger; that
 * element is registered as the hint target (and so excluded from the layer's DOM
 * scan — never double-hinted). A near-drop-in for `Upload.Dragger`: same props,
 * pass the drop-area content as `children`.
 */
export function Dropzone({ children, hintLabel, ...rest }: DropzoneProps) {
  const { ref, hint, active } = useVimHint({ label: hintLabel });
  // Reach the dragger's clickable `.ant-upload-btn` from the wrapper and register
  // it — antd doesn't expose a ref to it directly.
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref(node ? node.querySelector<HTMLElement>('.ant-upload-btn') : null);
    },
    [ref],
  );
  return (
    <div ref={setRef} className={styles.wrap}>
      <Upload.Dragger {...rest}>
        <span className={clsx(styles.content, active && styles.dim)}>{children}</span>
        <VimHint hint={hint} placement="overlay" />
      </Upload.Dragger>
    </div>
  );
}
