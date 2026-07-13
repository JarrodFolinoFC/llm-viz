import { createElement } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { TrainingStage } from '../../core/stage';
import type { SpaceToken } from '../primitives/tokens';
import { PANEL_KINDS, type PanelKind } from './panelKinds';
import { paramOrder } from './paramTensor';

/** Canonical pipeline order (Data → … → Update) for laying out the stage filter. */
export const STAGE_ORDER = Object.values(TrainingStage) as TrainingStage[];

/**
 * A flow UI as data: a typed internal DSL. A {@link FlowSpec} is a tree of
 * node kinds — panels (a component plus a typed `bind` from the flow view to
 * its props), labelled arrows, renderer-neutral layout containers, shared-track
 * grids, and the loss slot. Specs are PURE DATA with no UI-framework types in
 * them: layout nodes carry direction/gap/wrap/align as tokens, and the active
 * renderer decides what a row, a column or a grid IS on its platform.
 *
 * Build specs with the {@link flow} factory, then render with FlowBody (the
 * controlled headless renderer) or the web layer's FlowRenderer/SelfFilteredFlow.
 */

/** A panel leaf: a component bound to the flow view. */
export interface PanelNode<V> {
  kind: 'panel';
  /** Which training phase this panel belongs to — drives the badge and the
   *  per-stage show/hide filter. */
  stage: TrainingStage;
  /** Which panel *kind* this is — standard data panel or a companion aside. */
  panelKind: PanelKind;
  /** The parameter tensors this panel involves — drives the per-parameter
   *  filter. Empty means the panel isn't tensor-specific (corpus, loss). */
  tensors: readonly string[];
  render: (view: V) => ReactNode;
}

/** A labelled connector between two panels. */
export interface ArrowNode {
  kind: 'arrow';
  label?: ReactNode;
}

/**
 * The Training-loss panel's place in the flow. The panel itself arrives via
 * the loss-slot context (built by the stage shell, not the spec); this node
 * lets a spec position it inside the pipeline — a spec without one keeps the
 * default behaviour of the loss rendering after the pipeline.
 */
export interface LossSlotNode {
  kind: 'lossSlot';
}

/** Renderer-neutral layout options for a flow row/stack. */
export interface FlowLayoutOpts {
  gap?: SpaceToken | number;
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  /** A column (companion note/panel/JS stacks) instead of a row. */
  vertical?: boolean;
  /** Web-only styling hook (e.g. the companion-stack framing). Renderers
   *  without a class concept ignore it. */
  className?: string;
}

/**
 * A layout container as data — no UI-framework component or props embedded.
 * `flowRow` marks a pipeline stage row: the renderer collapses it to a column
 * in the vertical arrangement and dissolves it into the wrap in `collapsed`.
 */
export interface LayoutNode<V> extends FlowLayoutOpts {
  kind: 'layout';
  flowRow?: boolean;
  children: FlowNode<V>[];
}

/** One row of a {@link GridNode}: its cells occupy consecutive column tracks,
 *  or (with `span`) one cell stretched across the grid's full width. */
export interface GridRowNode<V> {
  kind: 'gridRow';
  span?: boolean;
  cells: FlowNode<V>[];
}

/**
 * A grid section whose column tracks are shared by every (non-span) row: each
 * track sizes to its widest cell across ALL rows, so the i-th cell of one row
 * column-aligns with the i-th cell of every other — e.g. a weight panel
 * sitting exactly above its post-step counterpart — with no hand-measured
 * widths. `span` rows (full-width content) sit between them without
 * contributing to the tracks.
 */
export interface GridNode<V> {
  kind: 'grid';
  /** Grid container gaps. */
  props: { rowGap?: number | string; columnGap?: number | string };
  rows: GridRowNode<V>[];
}

export type FlowNode<V> = PanelNode<V> | ArrowNode | LayoutNode<V> | GridNode<V> | LossSlotNode;
/** A complete flow UI as data: a tree rooted at one node (usually a layout). */
export type FlowSpec<V> = FlowNode<V>;

/**
 * Per-flow builder set, bound once to the view type `V`. Binding `V` here
 * keeps `bind` callbacks annotation-free — `view` is `V` everywhere.
 *
 *     const { flex, panel, arrow } = flow<BigramFlowView>();
 */
export function flow<V>() {
  return {
    /**
     * Bind a panel component to the view; `bind`'s result is checked against
     * its props. The leading `stage` tags the panel with its training phase:
     * it's injected as the component's `stage` prop (so the badge always
     * matches) and is what the per-stage filter keys off. `opts` carry the
     * other two filter axes (`kind`, `tensors`).
     */
    panel: <P,>(
      stage: TrainingStage,
      Component: ComponentType<P>,
      bind: (view: V) => P,
      opts: { kind?: PanelKind; tensors?: readonly string[] } = {},
    ): PanelNode<V> => {
      // Public params stay strongly typed (bind is checked against P at the
      // call site); the props are erased only to satisfy createElement.
      const C = Component as ComponentType<Record<string, unknown>>;
      return {
        kind: 'panel',
        stage,
        panelKind: opts.kind ?? 'standard',
        tensors: opts.tensors ?? [],
        render: (view) => createElement(C, { ...(bind(view) as Record<string, unknown>), stage }),
      };
    },
    arrow: (label?: ReactNode): ArrowNode => ({ kind: 'arrow', label }),
    /** A column-aligned grid section — see {@link GridNode}. */
    grid: (props: GridNode<V>['props'], ...rows: GridRowNode<V>[]): GridNode<V> => ({
      kind: 'grid',
      props,
      rows,
    }),
    /** One track-aligned row of a `grid`: the i-th cell lands in the i-th column. */
    gridRow: (...cells: FlowNode<V>[]): GridRowNode<V> => ({ kind: 'gridRow', cells }),
    /** A full-width `grid` row: spans every column without affecting the tracks. */
    spanRow: (...cells: FlowNode<V>[]): GridRowNode<V> => ({ kind: 'gridRow', span: true, cells }),
    /** Place the shell-provided Training-loss panel here — see {@link LossSlotNode}. */
    lossSlot: (): LossSlotNode => ({ kind: 'lossSlot' }),
    /**
     * A pipeline row (or, with `vertical`, a grouped column) as pure data.
     * Marked `flowRow` so the renderer can collapse it to a single column in
     * the vertical arrangement and dissolve rows in `collapsed` — the mobile
     * behaviour lives with the renderer, not in specs.
     */
    flex: (opts: FlowLayoutOpts, ...children: FlowNode<V>[]): LayoutNode<V> => ({
      kind: 'layout',
      flowRow: true,
      ...opts,
      children,
    }),
  };
}

/** Exhaustiveness guard: a `default` here turns a new, unhandled node kind into a compile error. */
export function assertNever(node: never): never {
  throw new Error(`Unhandled flow node: ${JSON.stringify(node)}`);
}

/**
 * A panel passes the parameter filter when at least one tensor it touches is
 * still shown. An inactive filter (nothing hidden) shows everything; once any
 * tensor is hidden, panels tagged with no tensor (corpus, loss) drop out too.
 */
export function tensorVisible(tensors: readonly string[], hidden: ReadonlySet<string>): boolean {
  if (hidden.size === 0) return true;
  return tensors.length > 0 && tensors.some((t) => !hidden.has(t));
}

/** Collect the distinct training stages a spec's panels are tagged with. */
function collectStages<V>(node: FlowNode<V>, acc: Set<TrainingStage>): void {
  switch (node.kind) {
    case 'panel':
      acc.add(node.stage);
      return;
    case 'arrow':
      return;
    case 'layout':
      node.children.forEach((c) => collectStages(c, acc));
      return;
    case 'grid':
      node.rows.forEach((r) => r.cells.forEach((c) => collectStages(c, acc)));
      return;
    case 'lossSlot':
      acc.add(TrainingStage.Loss);
      return;
    default:
      return assertNever(node);
  }
}

/** Does the spec position the loss panel itself (via a lossSlot node)? */
export function specHasLossSlot<V>(node: FlowNode<V>): boolean {
  switch (node.kind) {
    case 'lossSlot':
      return true;
    case 'layout':
      return node.children.some(specHasLossSlot);
    case 'grid':
      return node.rows.some((r) => r.cells.some(specHasLossSlot));
    default:
      return false;
  }
}

/** The stages a spec contains, in canonical pipeline order. */
export function stagesInSpec<V>(spec: FlowSpec<V>): TrainingStage[] {
  const present = new Set<TrainingStage>();
  collectStages(spec, present);
  return STAGE_ORDER.filter((s) => present.has(s));
}

/** Collect the distinct panel kinds a spec's panels are tagged with. */
function collectKinds<V>(node: FlowNode<V>, acc: Set<PanelKind>): void {
  switch (node.kind) {
    case 'panel':
      acc.add(node.panelKind);
      return;
    case 'arrow':
      return;
    case 'layout':
      node.children.forEach((c) => collectKinds(c, acc));
      return;
    case 'grid':
      node.rows.forEach((r) => r.cells.forEach((c) => collectKinds(c, acc)));
      return;
    case 'lossSlot':
      acc.add('standard');
      return;
    default:
      return assertNever(node);
  }
}

/** The panel kinds a spec contains, in canonical order (standard → companions). */
export function panelKindsInSpec<V>(spec: FlowSpec<V>): PanelKind[] {
  const present = new Set<PanelKind>();
  collectKinds(spec, present);
  return PANEL_KINDS.filter((k) => present.has(k));
}

/** Collect the distinct parameter tensors a spec's panels are tagged with. */
function collectTensors<V>(node: FlowNode<V>, acc: Set<string>): void {
  switch (node.kind) {
    case 'panel':
      node.tensors.forEach((t) => acc.add(t));
      return;
    case 'arrow':
    case 'lossSlot':
      return;
    case 'layout':
      node.children.forEach((c) => collectTensors(c, acc));
      return;
    case 'grid':
      node.rows.forEach((r) => r.cells.forEach((c) => collectTensors(c, acc)));
      return;
    default:
      return assertNever(node);
  }
}

/** The parameter tensors a spec contains, in canonical order (empty on flows
 *  that don't tag their panels — then the Parameters filter group doesn't show). */
export function tensorsInSpec<V>(spec: FlowSpec<V>): string[] {
  const present = new Set<string>();
  collectTensors(spec, present);
    // Registered tensors first (canonical order), then any unregistered tags in
  // spec order — an app that skipped registration still gets a stable bar.
  const canonical = paramOrder().filter((t) => present.has(t));
  const rest = [...present].filter((t) => !canonical.includes(t));
  return [...canonical, ...rest];
}
