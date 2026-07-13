import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from 'shared-ui';
import { CloseOutlined, DoubleRightOutlined, PushpinOutlined } from '@ant-design/icons';

import styles from './pinnedPanels.module.css';

/**
 * Panel pin + maximize, shared across the whole app.
 *
 * A panel is identified by a stable `useId()`. Pinning adds it to `pinnedIds`;
 * maximizing sets `maximizedId`. The panel itself stays stateless — when pinned
 * or maximized it *portals its live content* into the drawer / overlay targets
 * owned here, so the copies re-render with the flow (no stored snapshots) and
 * the whole feature is one small piece of shared state instead of one flag per
 * panel. The pinned panels also stay in place in the main flow.
 */
interface PanelActions {
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  maximizedId: string | null;
  maximize: (id: string | null) => void;
  /** Portal targets (as state, so panels re-render once they've mounted). */
  drawerTarget: HTMLElement | null;
  maxTarget: HTMLElement | null;
}

const Ctx = createContext<PanelActions>({
  isPinned: () => false,
  togglePin: () => {},
  maximizedId: null,
  maximize: () => {},
  drawerTarget: null,
  maxTarget: null,
});

export const usePanelActions = () => useContext(Ctx);

export function PinnedPanelsProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set());
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  // Manual collapse of the drawer (Ctrl+G / the hide button), independent of the
  // auto-hide when nothing is pinned. Any pin/unpin reveals it again.
  const [collapsed, setCollapsed] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<HTMLElement | null>(null);
  const [maxTarget, setMaxTarget] = useState<HTMLElement | null>(null);

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setCollapsed(false); // pinning or unpinning brings the drawer back
  }, []);
  const isPinned = useCallback((id: string) => pinned.has(id), [pinned]);
  const maximize = useCallback((id: string | null) => setMaximizedId(id), []);

  // Esc closes the maximized panel.
  useEffect(() => {
    if (maximizedId == null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMaximizedId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maximizedId]);

  // Ctrl+G toggles the pinned drawer (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 'g') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      e.preventDefault();
      setCollapsed((c) => !c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const drawerOpen = pinned.size > 0 && !collapsed;

  const value = useMemo(
    () => ({ isPinned, togglePin, maximizedId, maximize, drawerTarget, maxTarget }),
    [isPinned, togglePin, maximizedId, maximize, drawerTarget, maxTarget],
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* RHS drawer — pinned panels portal their live copies in here. Always
          mounted (so its portal target is stable) and slid off-screen when empty. */}
      <aside className={`${styles.drawer} no-print`} data-open={drawerOpen} aria-hidden={!drawerOpen}>
        <div className={styles.drawerHead}>
          <span>
            <PushpinOutlined /> Pinned ({pinned.size})
          </span>
          <span className={styles.drawerHeadActions}>
            <Button size="small" type="text" onClick={() => setPinned(new Set())} disabled={pinned.size === 0}>
              Clear all
            </Button>
            <Button
              size="small"
              type="text"
              icon={<DoubleRightOutlined />}
              onClick={() => setCollapsed(true)}
              aria-label="Hide pinned panels (Ctrl+G)"
            />
          </span>
        </div>
        <div ref={setDrawerTarget} className={styles.drawerBody} />
      </aside>

      {/* Fullscreen overlay for a single maximized panel. */}
      <div
        className={`${styles.overlay} no-print`}
        data-open={maximizedId != null}
        onClick={() => setMaximizedId(null)}
      >
        <div className={styles.overlayInner} onClick={(e) => e.stopPropagation()}>
          <Button
            className={styles.overlayClose}
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setMaximizedId(null)}
            aria-label="Close maximized panel"
          />
          <div ref={setMaxTarget} />
        </div>
      </div>
    </Ctx.Provider>
  );
}
