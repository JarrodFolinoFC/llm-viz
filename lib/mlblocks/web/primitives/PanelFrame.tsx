import { useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ActionMenu, Button, Panel as UiPanel } from 'shared-ui';
import { ExpandOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons';

import type { PanelFrameProps } from '../../react/primitives/types';
import type { PanelSize } from '../../react/viewOptions';
import { usePanelActions } from '../pinnedPanels';

/**
 * The web panel chrome: shared-ui's `Panel` card plus the pin/maximize
 * actions — a ⋮ menu to pin the panel into the RHS drawer or maximize it
 * full-screen. When pinned or maximized it portals a live copy of itself into
 * the drawer / overlay owned by {@link PinnedPanelsProvider}; the original
 * stays in place in the flow. Pin/maximize is a web feature: the headless
 * Panel knows nothing about it, and a native PanelFrame simply won't have it.
 */
export function PanelFrame({ title, size, dimmed, className, style, children }: PanelFrameProps) {
  const id = useId();
  const { isPinned, togglePin, maximize, maximizedId, drawerTarget, maxTarget } = usePanelActions();
  const pinned = isPinned(id);
  const maximized = maximizedId === id;

  // One frame builder, reused for the in-flow panel and its portaled copies.
  const frame = (extra: ReactNode, sz: PanelSize) => (
    <UiPanel title={title} size={sz} dimmed={dimmed} className={className} style={style} extra={extra}>
      {children}
    </UiPanel>
  );

  const menu = (
    <ActionMenu
      label="Panel actions"
      items={[
        {
          key: 'p',
          label: pinned ? 'Unpin' : 'Pin',
          icon: pinned ? <PushpinFilled /> : <PushpinOutlined />,
          onSelect: () => togglePin(id),
        },
        { key: 'f', label: 'Maximize', icon: <ExpandOutlined />, onSelect: () => maximize(id) },
      ]}
    />
  );

  const unpin = (
    <Button size="small" type="text" icon={<PushpinFilled />} onClick={() => togglePin(id)} aria-label="Unpin panel" />
  );

  return (
    <>
      {frame(menu, size)}
      {pinned && drawerTarget && createPortal(frame(unpin, size), drawerTarget)}
      {maximized && maxTarget && createPortal(frame(null, 'l'), maxTarget)}
    </>
  );
}
