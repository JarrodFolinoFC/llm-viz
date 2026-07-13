// A dependency-free multi-series line chart. Each series is a single SVG
// <polyline>; all series share the same x-axis (point index → label), with a
// horizontal gridline at 0 / mid / max and a hover dot per point. The viewBox
// is fixed and the SVG scales to its container width. A single-series chart is
// just `series={[one]}` (the legend only renders for two or more).

import './charts.css';

export interface Point {
  label: string;
  value: number;
}

export interface Series {
  label: string;
  /** Optional fixed colour; falls back to the palette by position. */
  color?: string;
  /** One value per shared x position. All series should be the same length. */
  points: Point[];
}

// Fallback hues for series without an explicit colour.
const PALETTE = ['#f8836b', '#38bdf8', '#4ade80', '#facc15', '#c084fc', '#f472b6'];

const defaultFormat = (n: number) => n.toLocaleString();

export interface LineChartProps {
  title?: string;
  series: Series[];
  height?: number;
  format?: (n: number) => string;
  emptyText?: string;
  /**
   * Lower bound of the y-axis. Defaults to 0 (bars/lines read from the origin);
   * set it higher to zoom into a band where all the values live (e.g. 85 for a
   * percentage that never dips below the 90s).
   */
  yMin?: number;
}

export function LineChart({
  title,
  series,
  height = 240,
  format = defaultFormat,
  emptyText = 'No data',
  yMin = 0,
}: LineChartProps) {
  const W = 720;
  const H = height;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 52;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // x labels come from the first series (all series are aligned by index).
  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const n = labels.length;

  const max = series.reduce((m, s) => s.points.reduce((mm, p) => Math.max(mm, p.value), m), yMin);
  // Guarantee a non-zero span even when every value sits on the yMin floor.
  const top = max <= yMin ? yMin + 1 : max;

  const x = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - yMin) / (top - yMin)) * innerH;

  const colorOf = (s: Series, i: number) => s.color ?? PALETTE[i % PALETTE.length];

  const ticks = [yMin, (yMin + top) / 2, top];
  const step = Math.max(1, Math.ceil(n / 8));

  return (
    <div className="linechart">
      {title && <h3>{title}</h3>}
      {n === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--c-border-default)"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="central"
                  className="axis-lbl"
                >
                  {format(t)}
                </text>
              </g>
            ))}

            {labels.map((label, i) =>
              i % step === 0 || i === n - 1 ? (
                <text
                  key={label + i}
                  x={x(i)}
                  y={H - padB + 18}
                  textAnchor="middle"
                  className="axis-lbl"
                >
                  {label}
                </text>
              ) : null,
            )}

            {series.map((s, si) => {
              const color = colorOf(s, si);
              const line = s.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
              return (
                <g key={s.label}>
                  <polyline
                    points={line}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {s.points.map((p, i) => (
                    <circle key={i} cx={x(i)} cy={y(p.value)} r={3} fill={color}>
                      <title>{`${s.label} · ${p.label}: ${format(p.value)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>

          {series.length > 1 && (
            <ul className="line-legend">
              {series.map((s, si) => (
                <li key={s.label}>
                  <span className="swatch" style={{ background: colorOf(s, si) }} />
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
