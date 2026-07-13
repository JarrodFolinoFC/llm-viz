import type { ReactNode } from 'react';
import { Modal } from 'antd';

import styles from './DetailModal.module.css';

/** The web detail dialog: antd Modal, mask-less and floating — the page stays
 *  interactive so clicking another row switches the working live. */
export function DetailModal({ open, onClose, title, width = 480, children }: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  width?: number;
  children?: ReactNode;
}) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} mask={false} width={width} wrapClassName={styles.detailWrap} title={title}>
      {children}
    </Modal>
  );
}
