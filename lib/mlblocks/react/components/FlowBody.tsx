import { useMemo } from 'react';
import type { Key, ReactNode } from 'react';

import { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { useViewOptions } from '../viewOptions';
import type { PanelKind } from '../flow/panelKinds';
import { useLossSlot } from '../flow/lossSlot';
import {
  assertNever,
  specHasLossSlot,
  tensorVisible,
  type FlowNode,
  type FlowSpec,
} from '../flow/spec';

/**
 * A labelled connector between two pipeline panels. Orientation follows the
 * arrangement: right-pointing in the row layouts, down-pointing in `vertical`
 * — computed here (headless data), drawn by the renderer's Text.
 */
function FlowArrow({ label }: { label?: ReactNode }) {
  const P = useP();
  const { arrangement } = useViewOptions();
  const down = arrangement === 'vertical';
  return (
    <P.View
      direction="col"
      align="center"
      justify="center"
      sty={{ color: 'textMuted', ...(down ? { py: 'xs' } : { px: 'xs' }) }}
    >
      <P.Text sty={{ fontRem: 1.6, lh: 1 }}>{down ? '↓' : '→'}</P.Text>
      {label && <P.Text sty={{ font: 'sm', nowrap: true }}>{label}</P.Text>}
    </P.View>
  );
}

/** Render-time settings threaded through the tree. */
interface RenderCtx {
  hideArrows: boolean;
  hidden: ReadonlySet<TrainingStage>;
  hiddenKinds: ReadonlySet<PanelKind>;
  hiddenTensors: ReadonlySet<string>;
  /** The shell-provided loss panel, rendered wherever a lossSlot node sits. */
  loss: ReactNode;
}

/** Does this node (or, for a container, any descendant) contain a still-visible panel? */
function hasVisiblePanel<V>(node: FlowNode<V>, ctx: RenderCtx): boolean {
  switch (node.kind) {
    case 'panel':
      return (
        !ctx.hidden.has(node.stage) &&
        !ctx.hiddenKinds.has(node.panelKind) &&
        tensorVisible(node.tensors, ctx.hiddenTensors)
      );
    case 'arrow':
      return false;
    case 'layout':
      return node.children.some((c) => hasVisiblePanel(c, ctx));
    case 'grid':
      return node.rows.some((r) => r.cells.some((c) => hasVisiblePanel(c, ctx)));
    case 'lossSlot':
      // The loss readout is a standard panel (no tensor), so the kind and
      // parameter filters apply too.
      return (
        !ctx.hidden.has(TrainingStage.Loss) &&
        !ctx.hiddenKinds.has('standard') &&
        tensorVisible([], ctx.hiddenTensors)
      );
    default:
      return assertNever(node);
  }
}

/**
 * Drop the children whose stage or kind is hidden (and any layout left with no
 * visible panels), then tidy the connectors: a stranded arrow — leading,
 * trailing, or left adjacent to another arrow once its panel neighbour is gone —
 * is removed so the remaining panels still read as a clean pipeline.
 */
function visibleChildren<V>(children: FlowNode<V>[], ctx: RenderCtx): FlowNode<V>[] {
  const kept = children.filter((c) => (c.kind === 'arrow' ? true : hasVisiblePanel(c, ctx)));
  const out: FlowNode<V>[] = [];
  for (const c of kept) {
    if (c.kind === 'arrow' && (out.length === 0 || out[out.length - 1].kind === 'arrow')) continue;
    out.push(c);
  }
  while (out.length && out[out.length - 1].kind === 'arrow') out.pop();
  return out;
}

function RenderNode<V>({ node, view, ctx }: { node: FlowNode<V>; view: V; ctx: RenderCtx }): ReactNode {
  const P = useP();
  switch (node.kind) {
    case 'arrow':
      return ctx.hideArrows ? null : <FlowArrow label={node.label} />;
    case 'panel':
      return node.render(view);
    case 'lossSlot':
      return ctx.loss;
    case 'layout':
      return (
        <P.FlowLayout
          direction={node.vertical ? 'col' : 'row'}
          gap={node.gap}
          wrap={node.wrap}
          align={node.align}
          justify={node.justify}
          flowRow={node.flowRow && !node.vertical}
          className={node.className}
        >
          {visibleChildren(node.children, ctx).map((child, i) => (
            <RenderNode key={keyOf(child, i)} node={child} view={view} ctx={ctx} />
          ))}
        </P.FlowLayout>
      );
    case 'grid': {
      const rows = node.rows
        // With arrows hidden, drop them from the cells too — an empty cell
        // would still claim a column track (and its gaps).
        .map((r) => ({
          ...r,
          cells: visibleChildren(r.cells, ctx).filter(
            (c) => !(ctx.hideArrows && c.kind === 'arrow'),
          ),
        }))
        .filter((r) => r.cells.length > 0);
      if (rows.length === 0) return null;
      // Every non-span row contributes to the shared tracks; each track sizes
      // to its widest cell across all of them.
      const nCols = Math.max(1, ...rows.filter((r) => !r.span).map((r) => r.cells.length));
      return (
        <P.TrackGrid
          nCols={nCols}
          rowGap={node.props.rowGap}
          columnGap={node.props.columnGap}
          rows={rows.map((row) => ({
            span: !!row.span,
            cells: row.cells.map((c, i) => ({
              content: <RenderNode key={i} node={c} view={view} ctx={ctx} />,
              arrow: c.kind === 'arrow',
            })),
          }))}
        />
      );
    }
    default:
      return assertNever(node);
  }
}

const keyOf = (node: { kind: string }, i: number): Key => `${node.kind}${i}`;

export interface FlowBodyProps<V> {
  spec: FlowSpec<V>;
  view: V;
  /** Training stages whose panels are currently filtered out. */
  hidden: ReadonlySet<TrainingStage>;
  /** Panel kinds currently filtered out (companion asides default to hidden). */
  hiddenKinds: ReadonlySet<PanelKind>;
  /** Parameter tensors currently filtered out (empty = the filter is inactive). */
  hiddenTensors: ReadonlySet<string>;
}

/**
 * The headless, CONTROLLED flow renderer: walks the spec, applies the settled
 * filter sets, and renders through the primitives (FlowLayout / TrackGrid /
 * FlowSurface). Filter *ownership* — persisted stage/kind/tensor selections
 * and their UI — is a platform concern: on web that's the root entry's
 * FlowRenderer/SelfFilteredFlow.
 */
export function FlowBody<V>({ spec, view, hidden, hiddenKinds, hiddenTensors }: FlowBodyProps<V>) {
  const P = useP();
  const { hideArrows, arrangement } = useViewOptions();
  const loss = useLossSlot();
  const inlineLoss = useMemo(() => specHasLossSlot(spec), [spec]);
  const ctx: RenderCtx = { hideArrows, hidden, hiddenKinds, hiddenTensors, loss };
  return (
    <P.FlowSurface arrangement={arrangement}>
      <RenderNode node={spec} view={view} ctx={ctx} />
      {loss &&
        !inlineLoss &&
        !hidden.has(TrainingStage.Loss) &&
        !hiddenKinds.has('standard') &&
        tensorVisible([], hiddenTensors) &&
        loss}
    </P.FlowSurface>
  );
}
