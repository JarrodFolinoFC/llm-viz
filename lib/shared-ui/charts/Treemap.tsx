// A dependency-free treemap: cell area ∝ value, laid out with the squarified
// algorithm in ./squarify. Shared by cost-control (spend by category) and
// super-tracker (portfolio allocation).

import { squarifyItems } from './squarify';
import './charts.css';

export interface Slice {
  label: string;
  value: number;
  /** Optional fixed colour; falls back to the palette by position. */
  color?: string;
}

// A spread of distinct hues; slices beyond the list wrap around.
export const CHART_COLORS = [
  '#f8836b',
  '#f8a96b',
  '#facc15',
  '#4ade80',
  '#34d399',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6',
  '#fb7185',
  '#a3e635',
  '#2dd4bf',
];

const defaultFormat = (n: number) => n.toLocaleString();

export interface TreemapProps {
  title?: string;
  data: Slice[];
  width?: number;
  height?: number;
  format?: (n: number) => string;
  /** Stretch the SVG to its container's width (the viewBox keeps proportions). */
  fluid?: boolean;
  emptyText?: string;
}

export function Treemap({
  title,
  data,
  width = 260,
  height = 170,
  format = defaultFormat,
  fluid = false,
  emptyText = 'No data',
}: TreemapProps) {
  // Sort before colouring so the palette follows rank (biggest slice = first hue).
  const slices = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((s, i) => ({ ...s, color: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }));
  const total = slices.reduce((s, d) => s + d.value, 0);

  const gap = 2;
  const cells = squarifyItems(slices, width, height).map((c) => ({
    ...c,
    pct: total ? (c.value / total) * 100 : 0,
  }));

  // Rough char budget so long labels don't spill out of small cells.
  const fit = (text: string, w: number, px: number) => {
    const max = Math.floor((w - 8) / (px * 0.6));
    return max >= text.length ? text : text.slice(0, Math.max(0, max - 1)) + '…';
  };

  return (
    <div className="treemap">
      {title && <h3>{title}</h3>}
      {total === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <svg
          width={fluid ? '100%' : width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="treemap-svg"
        >
          {cells.map((c) => {
            const iw = Math.max(0, c.w - gap);
            const ih = Math.max(0, c.h - gap);
            const showLabel = iw > 46 && ih > 18;
            const showValue = iw > 60 && ih > 34;
            return (
              <g key={c.label} transform={`translate(${c.x + gap / 2} ${c.y + gap / 2})`}>
                <rect width={iw} height={ih} rx={3} fill={c.color}>
                  <title>{`${c.label}: ${format(c.value)} (${c.pct.toFixed(1)}%)`}</title>
                </rect>
                {showLabel && (
                  <text x={6} y={14} className="treemap-lbl">
                    {fit(c.label, iw, 11)}
                  </text>
                )}
                {showValue && (
                  <text x={6} y={29} className="treemap-val">
                    {fit(format(c.value), iw, 10)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
