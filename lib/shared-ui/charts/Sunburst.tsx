// A dependency-free sunburst (radial icicle): each ring is one level of a
// hierarchy, each arc's sweep ∝ its value, children partitioning their parent's
// wedge. Built in the same spirit as the Treemap/LineChart here — hand-rolled
// SVG, no d3. Hue comes from the top-level ancestor (palette by rank), lightened
// with depth; hovering an arc highlights it and reads out its share in the
// centre; clicking a directory arc zooms into it (click the centre to zoom out).
//
// The data is a single root node whose `value` is derived from its leaves (an
// internal node with an explicit `value` is ignored in favour of its children's
// sum), so callers pass a raw size tree straight through.

import { useMemo, useState } from 'react';

import { CHART_COLORS } from './Treemap';
import './charts.css';

export interface SunburstNode {
  name: string;
  /** Leaf magnitude. Ignored for nodes with children (they sum their subtree). */
  value?: number;
  children?: SunburstNode[];
  /** Optional fixed hue for this node's whole subtree; else palette-by-rank. */
  color?: string;
}

export interface SunburstProps {
  data: SunburstNode;
  /** Diameter in px (the SVG is square and scales to its container). */
  size?: number;
  /** Rings drawn outward from the focused centre before deeper levels collapse. */
  rings?: number;
  format?: (n: number) => string;
  emptyText?: string;
}

const defaultFormat = (n: number) => n.toLocaleString();
const TAU = Math.PI * 2;

// One resolved node: the source node plus its computed value and palette hue.
interface Resolved {
  node: SunburstNode;
  name: string;
  value: number;
  color: string;
  children: Resolved[];
}

/** Lighten a #rrggbb hex toward white by `amount` (0 = unchanged, 1 = white). */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 0xff);
  const g = mix((n >> 8) & 0xff);
  const b = mix(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Sum leaf values into every node and fix each subtree's base hue. Top-level
// children take a palette colour by rank (biggest = first hue); descendants
// inherit their ancestor's hue so a wedge reads as one family down the rings.
function resolve(node: SunburstNode, color: string): Resolved {
  const kids = (node.children ?? []).map((c) => resolve(c, c.color ?? color));
  kids.sort((a, b) => b.value - a.value);
  const value = kids.length
    ? kids.reduce((s, k) => s + k.value, 0)
    : Math.max(0, node.value ?? 0);
  return { node, name: node.name, value, color, children: kids };
}

function paletteRoot(data: SunburstNode): Resolved {
  const kids = (data.children ?? [])
    .map((c) => resolve(c, c.color ?? '#8c8c8c'))
    .sort((a, b) => b.value - a.value)
    // Re-colour top level by rank now that it's sorted.
    .map((k, i) => recolor(k, k.node.color ?? CHART_COLORS[i % CHART_COLORS.length]));
  const value = kids.reduce((s, k) => s + k.value, 0);
  return { node: data, name: data.name, value, color: '#8c8c8c', children: kids };
}

// Repaint a resolved subtree to a base hue (used once the top level is ranked).
function recolor(r: Resolved, color: string): Resolved {
  return { ...r, color, children: r.children.map((c) => recolor(c, color)) };
}

interface Arc {
  key: string;
  r: Resolved;
  depth: number; // rings out from the focus (1 = first ring)
  a0: number;
  a1: number;
  fill: string;
  path: string;
}

/** Annular-sector path; angle 0 at 12 o'clock, sweeping clockwise. */
function arcPath(cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number): string {
  const pt = (r: number, a: number) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return (
    `M ${pt(rOut, a0)} A ${rOut} ${rOut} 0 ${large} 1 ${pt(rOut, a1)} ` +
    `L ${pt(rIn, a1)} A ${rIn} ${rIn} 0 ${large} 0 ${pt(rIn, a0)} Z`
  );
}

export function Sunburst({
  data,
  size = 420,
  rings = 4,
  format = defaultFormat,
  emptyText = 'No data',
}: SunburstProps) {
  const root = useMemo(() => paletteRoot(data), [data]);

  // Zoom: the path of names from the true root to the focused node. The focus
  // sits in the centre and its subtree spans the full circle.
  const [focus, setFocus] = useState<string[]>([]);
  const [hover, setHover] = useState<Arc | null>(null);

  // Walk to the focused node (falling back to root if a stale focus no longer
  // resolves, e.g. after the data reloads).
  let focusNode = root;
  const trail: Resolved[] = [root];
  for (const name of focus) {
    const next = focusNode.children.find((c) => c.name === name);
    if (!next) break;
    focusNode = next;
    trail.push(next);
  }

  const cx = size / 2;
  const cy = size / 2;
  const centreR = size * 0.16;
  const ringW = (size / 2 - centreR - 4) / rings;

  // Lay out arcs breadth-first from the focus across `rings` levels.
  const arcs: Arc[] = [];
  const walk = (r: Resolved, depth: number, a0: number, a1: number, keyPrefix: string) => {
    if (depth > rings || r.value <= 0) return;
    const span = a1 - a0;
    if (depth >= 1) {
      const rIn = centreR + (depth - 1) * ringW;
      const rOut = rIn + ringW - 1.5; // 1.5px gap between rings
      arcs.push({
        key: keyPrefix,
        r,
        depth,
        a0,
        a1,
        fill: lighten(r.color, Math.min(0.55, (depth - 1) * 0.13)),
        path: arcPath(cx, cy, rIn, rOut, a0, a1),
      });
    }
    let acc = a0;
    for (const child of r.children) {
      const frac = r.value ? child.value / r.value : 0;
      const cA1 = acc + span * frac;
      walk(child, depth + 1, acc, cA1, `${keyPrefix}/${child.name}`);
      acc = cA1;
    }
  };
  walk(focusNode, 0, 0, TAU, focusNode.name);

  const total = root.value;
  // What the centre reads out: the hovered arc if any, else the current focus.
  const active = hover?.r ?? focusNode;
  const activePct = total ? (active.value / total) * 100 : 0;

  const legend = root.children.slice(0, CHART_COLORS.length);

  if (total === 0) {
    return (
      <div className="sunburst">
        <p className="muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="sunburst">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="sunburst-svg"
        role="img"
        aria-label="Disk usage sunburst"
      >
        {arcs.map((arc) => {
          const dim = hover && !isAncestorOrSelf(hover.key, arc.key) && !isAncestorOrSelf(arc.key, hover.key);
          return (
            <path
              key={arc.key}
              d={arc.path}
              fill={arc.fill}
              className="sunburst-arc"
              style={{ opacity: dim ? 0.28 : 1, cursor: arc.r.children.length ? 'pointer' : 'default' }}
              onMouseEnter={() => setHover(arc)}
              onMouseLeave={() => setHover((h) => (h === arc ? null : h))}
              onClick={() => {
                if (!arc.r.children.length) return;
                // Focus this arc: its ancestry from the true root.
                setFocus(arc.key.split('/').slice(1));
              }}
            >
              <title>{`${arc.r.name}: ${format(arc.r.value)} (${((arc.r.value / total) * 100).toFixed(1)}%)`}</title>
            </path>
          );
        })}

        {/* Centre disc — the focus. Click to zoom out one level. */}
        <circle
          cx={cx}
          cy={cy}
          r={centreR}
          className="sunburst-centre"
          style={{ cursor: trail.length > 1 ? 'pointer' : 'default' }}
          onClick={() => setFocus((f) => f.slice(0, -1))}
        >
          <title>{trail.length > 1 ? 'Zoom out' : active.name}</title>
        </circle>
        <text x={cx} y={cy - 8} className="sunburst-centre-name">
          {active.name}
        </text>
        <text x={cx} y={cy + 12} className="sunburst-centre-val">
          {format(active.value)}
        </text>
        <text x={cx} y={cy + 28} className="sunburst-centre-pct">
          {activePct.toFixed(activePct < 10 ? 1 : 0)}%
        </text>
      </svg>

      {legend.length > 0 && (
        <ul className="sunburst-legend">
          {legend.map((l, i) => (
            <li key={l.name}>
              <span className="swatch" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="sunburst-legend-name" title={l.name}>
                {l.name}
              </span>
              <span className="sunburst-legend-val">{format(l.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Arc keys are `/`-joined name paths, so ancestry is a prefix test on segments.
function isAncestorOrSelf(maybeAncestor: string, key: string): boolean {
  return key === maybeAncestor || key.startsWith(`${maybeAncestor}/`);
}
