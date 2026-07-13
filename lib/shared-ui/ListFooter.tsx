import type { ReactNode } from 'react';
import { Flex, Popconfirm, Typography } from 'antd';

import { Button } from './Button';

export interface ListFooterProps {
  /** Left-side summary, e.g. "3 birthdays" or "5 cookies in the jar". */
  label: ReactNode;
  /** The Popconfirm question shown before the destructive clear. */
  confirmTitle: string;
  /** Confirm-button label inside the Popconfirm, e.g. "Remove all". */
  confirmText: string;
  /** Trigger-button label, e.g. "Clear all". */
  clearText: string;
  /** Wipe the list. Runs only after the user confirms. */
  onClear: () => void;
}

/**
 * The "N items · clear all" row the small list apps (birthdays, days-until,
 * cookie-jar) each rendered under their list: a muted count on the left and a
 * confirm-guarded destructive clear on the right. Centralises the layout and
 * the confirm-before-wiping affordance so the apps only supply their wording.
 */
export function ListFooter({
  label,
  confirmTitle,
  confirmText,
  clearText,
  onClear,
}: ListFooterProps) {
  return (
    <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Popconfirm
        title={confirmTitle}
        okText={confirmText}
        okButtonProps={{ danger: true }}
        onConfirm={onClear}
      >
        <Button type="text" danger>
          {clearText}
        </Button>
      </Popconfirm>
    </Flex>
  );
}
