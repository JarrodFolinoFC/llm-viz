import type { NativeHintView } from 'vimium-layer';

import styles from './VimHint.module.css';

export interface VimHintProps {
  /** The live hint state from `useVimHint` (null when not in hint mode). */
  hint: NativeHintView | null;
  /**
   * How the label occupies space in the component:
   * - `slot` (default): an **always-reserved but invisible** keycap baked into
   *   the layout — it holds the width for two characters so the component never
   *   reflows, shows nothing at rest, and fills with the accent-lit label in hint
   *   mode. For controls with text (buttons, links).
   * - `overlay`: for **icon-like** controls — the 2 letters centered on top while
   *   hint mode is on, nothing at rest. Pair with the host hiding its glyph's
   *   interior + drawing an outline frame, so the letters read as the icon.
   * - `slot-end`: like `slot` but a **fixed-width** trailing keycap — the box
   *   never resizes when the label lights up, so an icon before it (e.g. the ⋮
   *   action-menu glyph) never shifts. For a hint that trails an icon.
   * - `corner` / `inline`: floating placements, only while hint mode is on.
   */
  placement?: 'slot' | 'slot-end' | 'overlay' | 'corner' | 'inline';
}

/**
 * The in-component vim hint label — the design-integrated alternative to the
 * VimLayer's floating overlay chip.
 *
 * The default `slot` placement reserves width up front (so toggling hint mode
 * never shifts the layout) but is otherwise invisible until hint mode (`f`)
 * assigns this element a label, at which point it lights up (accent fill). The
 * `overlay` placement draws nothing at rest and centers the letters over the
 * host in hint mode.
 */
export function VimHint({ hint, placement = 'slot' }: VimHintProps) {
  const active = !!hint && hint.matched;

  if (placement === 'slot' || placement === 'slot-end') {
    const typed = active ? hint!.typed : '';
    const rest = active ? hint!.label.slice(typed.length) : '';
    return (
      <kbd aria-hidden className={placement === 'slot-end' ? styles.slotEnd : styles.slot}>
        {active && (
          <>
            <span className={styles.typed}>{typed}</span>
            {rest}
          </>
        )}
      </kbd>
    );
  }

  if (placement === 'overlay') {
    // Icon-like: nothing at rest; in hint mode the letters sit dead-centre over
    // the host (which hides its own glyph interior and frames the space).
    if (!active) return null;
    const rest = hint!.label.slice(hint!.typed.length);
    return (
      <span aria-hidden className={styles.overlay}>
        <span className={styles.typed}>{hint!.typed}</span>
        {rest}
      </span>
    );
  }

  // Floating placements (corner / inline): only present while hint mode is on.
  if (!active) return null;
  const rest = hint!.label.slice(hint!.typed.length);
  return (
    <kbd aria-hidden className={`${styles.badge} ${placement === 'inline' ? styles.inline : styles.corner}`}>
      <span className={styles.typed}>{hint!.typed}</span>
      {rest}
    </kbd>
  );
}
