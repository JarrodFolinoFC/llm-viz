import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Dropdown } from 'antd';
import type { DropdownProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { acquireVimKeyboard } from 'vimium-layer';

import { Button } from './Button';
import styles from './ActionMenu.module.css';

export interface ActionMenuItem {
  /** Single-character accelerator — shown in the row and pressable while the
   *  menu is open (case-insensitive). Keep them unique within one menu. */
  key: string;
  label: string;
  icon?: ReactNode;
  /** Render as a destructive action (danger colour). */
  danger?: boolean;
  /** Greyed out and inert — neither clickable nor firable by its accelerator. */
  disabled?: boolean;
  onSelect: () => void;
}

/** A titled section that groups related actions under a heading. */
export interface ActionMenuGroup {
  type: 'group';
  /** The section heading shown above the group's items. */
  label: string;
  items: ActionMenuItem[];
}

export type ActionMenuEntry = ActionMenuItem | ActionMenuGroup | { type: 'divider' };

export interface ActionMenuProps {
  items: ActionMenuEntry[];
  /** Accessible name + tooltip for the ellipsis trigger. */
  label?: string;
  placement?: DropdownProps['placement'];
}

const isItem = (e: ActionMenuEntry): e is ActionMenuItem => !('type' in e);
const isGroup = (e: ActionMenuEntry): e is ActionMenuGroup => 'type' in e && e.type === 'group';

/** Every actionable item, flattened out of any groups — for accelerator lookup. */
const flatItems = (entries: ActionMenuEntry[]): ActionMenuItem[] =>
  entries.flatMap((e) => (isItem(e) ? [e] : isGroup(e) ? e.items : []));

/**
 * A vertical-ellipsis (⋮) button that opens a self-contained action menu: every
 * action shows its icon, text label, and a single-key accelerator in a reserved
 * slot, so the moment the menu opens each item is ready to click *or* to fire by
 * pressing its key.
 *
 * Unlike the shared-ui controls that wire into the page's vim hint layer, this
 * menu owns the keyboard while it's open — it calls `acquireVimKeyboard` (the
 * layer's own "someone else has the keyboard" escape hatch, also used by the
 * AppSwitcher palette) so `f`/scroll keys stay quiet and its own accelerators
 * drive it. Esc, an accelerator, or an outside click all close it.
 */
export function ActionMenu({ items, label = 'Actions', placement = 'bottomRight' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  // Latest items in a ref so the key handler stays current without re-binding
  // (and re-acquiring the keyboard) whenever the caller passes a fresh array.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const run = (item: ActionMenuItem) => {
    if (item.disabled) return;
    setOpen(false);
    item.onSelect();
  };

  useEffect(() => {
    if (!open) return;
    const release = acquireVimKeyboard();
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        return;
      }
      const hit = flatItems(itemsRef.current).find(
        (i) => !i.disabled && i.key.toLowerCase() === e.key.toLowerCase(),
      );
      if (hit) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        hit.onSelect();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      release();
    };
  }, [open]);

  const renderItem = (entry: ActionMenuItem) => (
    <button
      key={entry.key}
      type="button"
      role="menuitem"
      aria-label={entry.label}
      aria-keyshortcuts={entry.key}
      aria-disabled={entry.disabled || undefined}
      disabled={entry.disabled}
      className={clsx(styles.row, entry.danger && styles.danger, entry.disabled && styles.disabled)}
      onClick={() => run(entry)}
    >
      <span className={styles.key} aria-hidden>
        {entry.key}
      </span>
      {entry.icon != null && (
        <span className={styles.icon} aria-hidden>
          {entry.icon}
        </span>
      )}
      <span className={styles.text}>{entry.label}</span>
    </button>
  );

  const menu = (
    <div className={styles.menu} role="menu">
      {items.map((entry, i) =>
        isItem(entry) ? (
          renderItem(entry)
        ) : isGroup(entry) ? (
          <div key={`group-${i}`} role="group" aria-label={entry.label} className={styles.group}>
            <div className={styles.groupHeading} aria-hidden>
              {entry.label}
            </div>
            {entry.items.map(renderItem)}
          </div>
        ) : (
          <div key={`divider-${i}`} className={styles.divider} role="separator" />
        ),
      )}
    </div>
  );

  return (
    <Dropdown open={open} onOpenChange={setOpen} trigger={['click']} placement={placement} popupRender={() => menu}>
      <Button
        type="text"
        size="small"
        aria-label={label}
        title={label}
        icon={<MoreOutlined style={{ fontSize: 22 }} />}
        style={{ paddingInline: 4 }}
        // The `f` hint label sits in a slot to the right of the ⋮, not centred
        // on top of it.
        hintTrailing
      />
    </Dropdown>
  );
}
