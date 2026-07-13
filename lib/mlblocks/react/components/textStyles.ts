import type { Sty } from '../primitives/tokens';

/**
 * The shared text-role styles — the token-object translation of the old
 * panelText/panelTitles CSS modules. One definition per role so panels agree
 * on what a hint or a phase suffix looks like on every renderer.
 */
export const textStyles = {
  /** Muted helper / placeholder line inside a panel. */
  hint: { color: 'textSecondary', font: 'sm' } satisfies Sty,
  /** Same, but captioning content rendered directly below it. */
  hintCaption: { color: 'textSecondary', font: 'sm', mb: 'xs' } satisfies Sty,
  /** The muted phase suffix after a title symbol; em-sized so it tracks the panel size. */
  phase: { color: 'textMuted', em: 0.85 } satisfies Sty,
} as const;
