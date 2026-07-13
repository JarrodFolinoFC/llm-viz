import type { IconName } from '../primitives/icons';

/**
 * The *kind* of a flow panel — the second axis of the page filter, alongside
 * the training stage. `standard` is the data panel itself; the others are
 * companion asides that ride beside it: the plain-English ConceptNote, the
 * pure-JavaScript JsNote, and the DialsNote — a panel's weights/biases as
 * live needle dials. A closed vocabulary: every kind corresponds to a
 * framework-shipped companion component, so the list is owned by the code
 * that renders it. (Per-route persistence of the filter lives with the web
 * renderer; this module is the platform-free vocabulary + set algebra.)
 */
export type PanelKind = 'standard' | 'plainEnglish' | 'js' | 'dials';

/** Canonical order for laying out the kind toggles. */
export const PANEL_KINDS: PanelKind[] = ['standard', 'plainEnglish', 'js', 'dials'];

export interface PanelKindMeta {
  /** Human-readable name, shown on the filter toggle. */
  label: string;
  /** Icon marking the kind on its toggle (renderer-neutral name). */
  icon: IconName;
  /** Accent colour for the toggle's shown state. */
  color: string;
}

/** Label, icon, and accent colour for each {@link PanelKind}. */
export const PANEL_KIND_META: Record<PanelKind, PanelKindMeta> = {
  standard: { label: 'Standard', icon: 'appstore', color: '#475569' },
  plainEnglish: { label: 'Plain English', icon: 'message', color: '#0EA5E9' },
  // Amber rather than the JS-brand yellow — the accent tints the icon, and
  // #F7DF1E is unreadable on a light surface.
  js: { label: 'JS', icon: 'code', color: '#D97706' },
  // A panel's weights/biases shown as live needle dials.
  dials: { label: 'Dials', icon: 'dashboard', color: '#0D9488' },
};

export const DEFAULT_SHOWN_KINDS: PanelKind[] = ['standard'];

/** Every kind, minus the shown ones — the render-side filter shape. */
export const complementKinds = (shown: ReadonlySet<PanelKind>): ReadonlySet<PanelKind> =>
  new Set(PANEL_KINDS.filter((k) => !shown.has(k)));

/** All companion kinds hidden — the filter a kind-less page renders with. */
export const DEFAULT_HIDDEN_KINDS: ReadonlySet<PanelKind> = complementKinds(new Set(DEFAULT_SHOWN_KINDS));
