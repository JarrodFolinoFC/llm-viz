import { TrainingStage } from '../../core/stage';
import { STAGE_META } from './stageMeta';

export interface ChartNode {
  id: string;
  stage: TrainingStage;
  /** Bold first line of the node. */
  title: string;
  /** Extra lines of live data under the title. */
  lines?: string[];
}
export interface ChartEdge {
  from: string;
  to: string;
  label?: string;
  /** Render as a dashed arrow — used for the update flowing back into the weights. */
  dashed?: boolean;
}

/** Full pipeline order for laying out the stage subgraphs. */
const STAGE_ORDER: TrainingStage[] = [
  TrainingStage.Data,
  TrainingStage.Parameters,
  TrainingStage.Forward,
  TrainingStage.Loss,
  TrainingStage.Backprop,
  TrainingStage.Update,
];

/** A numeric vector as a comma-joined string at the given precision. */
export const formatVec = (xs: number[], precision: number) => xs.map((x) => x.toFixed(precision)).join(', ');

/** Strip the chars that would break a mermaid quote/backtick/pipe wrapper. */
const clean = (s: string) => s.replace(/[`"|]/g, "'");

/** Edge labels aren't markdown-wrapped, so bracket/paren pairs would be read as
 *  node-shape syntax (`[]`, `()`) and break the parse — drop them. */
const cleanEdge = (s: string) => clean(s).replace(/[[\]()]/g, '');

const nodeLabel = (n: ChartNode) => {
  const body = [`**${clean(n.title)}**`, ...(n.lines ?? []).map(clean)].join('\n');
  // Backtick-wrapped markdown string → a multi-line, bold-title node label.
  return `${n.id}["\`${body}\`"]`;
};

/**
 * Assemble a mermaid `flowchart` from stage-tagged nodes and edges. Stages in
 * `hidden` are dropped (with any edge that would dangle), each surviving stage is
 * boxed in a colour-coded subgraph, and node labels are mermaid markdown. Returns
 * `''` when no stage is visible. Shared by every flow's overview chart so they
 * all read the same way.
 */
export function assembleFlowChart(
  nodes: ChartNode[],
  edges: ChartEdge[],
  hidden: ReadonlySet<TrainingStage>,
): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visible = (id: string) => {
    const n = byId.get(id);
    return !!n && !hidden.has(n.stage);
  };
  const visNodes = nodes.filter((n) => !hidden.has(n.stage));
  if (visNodes.length === 0) return '';

  const lines: string[] = ['flowchart TD'];
  const drawn: TrainingStage[] = [];
  for (const stage of STAGE_ORDER) {
    const group = visNodes.filter((n) => n.stage === stage);
    if (group.length === 0) continue;
    drawn.push(stage);
    lines.push(`  subgraph s_${stage}["${clean(STAGE_META[stage].label)}"]`);
    for (const n of group) lines.push(`    ${nodeLabel(n)}`);
    lines.push('  end');
  }
  for (const e of edges) {
    if (!visible(e.from) || !visible(e.to)) continue;
    const arrow = e.dashed ? '-.->' : '-->';
    lines.push(e.label ? `  ${e.from} ${arrow}|${cleanEdge(e.label)}| ${e.to}` : `  ${e.from} ${arrow} ${e.to}`);
  }
  for (const stage of drawn) {
    lines.push(`  style s_${stage} stroke:${STAGE_META[stage].color},stroke-width:2px`);
  }
  return lines.join('\n');
}
