import type { LossChartProps } from '../../react/primitives/types';

const W = 320;
const H = 120;
const PAD = { left: 34, right: 8, top: 8, bottom: 16 };

const MUTED = 'var(--c-text-muted)';
const SECONDARY = 'var(--c-text-secondary)';
const POSITIVE = 'var(--c-positive)';
const INFO = 'var(--c-info-fg)';

/**
 * The loss curve with real axes and reference lines: x is the actual step
 * number (so +10 runs space correctly), y is cross-entropy, a dashed line marks
 * random guessing at ln(V) and another marks the corpus's entropy floor — so
 * convergence reads as "gap to floor", and a plateau doesn't look like a bug.
 * Pure SVG (the same geometry ports to react-native-svg later).
 */
export function LossChart({ history, floor, baseline, epochLen, logScale, precision }: LossChartProps) {
  const toY = (v: number) => (logScale ? Math.log(Math.max(v, 1e-6)) : v);
  const losses = history.map((p) => p.loss);
  const refs = [floor, baseline].filter((v): v is number => v != null && v > 0);
  const lo = Math.min(...losses, ...refs);
  const hi = Math.max(...losses, ...refs);
  const span = toY(hi) - toY(lo) || 1;
  const lastStep = history[history.length - 1].step || 1;

  const x = (step: number) => PAD.left + (step / lastStep) * (W - PAD.left - PAD.right);
  const y = (v: number) => {
    const t = (toY(v) - toY(lo)) / span;
    return H - PAD.bottom - t * (H - PAD.top - PAD.bottom);
  };

  const points = history.map((p) => `${x(p.step).toFixed(1)},${y(p.loss).toFixed(1)}`).join(' ');
  const last = history[history.length - 1];
  // Y ticks at the domain edges plus the midpoint; X at 0 and the last step.
  const yTicks = [lo, (lo + hi) / 2, hi];
  const epochMarks: number[] = [];
  if (epochLen) {
    for (let s = epochLen; s < lastStep; s += epochLen) epochMarks.push(s);
  }

  const refLine = (v: number, stroke: string, label: string) => (
    <g key={label}>
      <line x1={PAD.left} y1={y(v)} x2={W - PAD.right} y2={y(v)} stroke={stroke} strokeWidth={1} strokeDasharray="4 3" />
      <text x={W - PAD.right} y={y(v) - 2} textAnchor="end" fontSize={8} fill={stroke}>
        {label} {v.toFixed(precision)}
      </text>
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', width: '100%', maxWidth: W, height: 'auto' }}
      aria-label="loss over steps"
    >
      {/* axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke={MUTED} strokeWidth={1} />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke={MUTED} strokeWidth={1} />
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left - 3} y1={y(v)} x2={PAD.left} y2={y(v)} stroke={MUTED} strokeWidth={1} />
          <text x={PAD.left - 5} y={y(v) + 3} textAnchor="end" fontSize={8} fill={SECONDARY}>
            {v.toFixed(precision)}
          </text>
        </g>
      ))}
      <text x={PAD.left} y={H - 4} fontSize={8} fill={SECONDARY}>0</text>
      <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize={8} fill={SECONDARY}>
        step {lastStep}
      </text>
      {/* epoch boundaries */}
      {epochMarks.map((s) => (
        <line key={s} x1={x(s)} y1={PAD.top} x2={x(s)} y2={H - PAD.bottom} stroke={MUTED} strokeWidth={0.5} strokeDasharray="2 4" />
      ))}
      {/* reference lines: random guessing above, the corpus floor below */}
      {baseline != null && refLine(baseline, SECONDARY, 'random ln V =')}
      {floor != null && floor > 0 && refLine(floor, POSITIVE, 'floor')}
      <polyline points={points} fill="none" stroke={INFO} strokeWidth={1.5} />
      <circle cx={x(last.step)} cy={y(last.loss)} r={2.5} fill={INFO}>
        <title>step {last.step}: {last.loss.toFixed(precision)}</title>
      </circle>
    </svg>
  );
}
