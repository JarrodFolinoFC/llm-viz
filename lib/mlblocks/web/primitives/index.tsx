import { useId } from 'react';
import type { ReactNode } from 'react';
import { Progress, Tooltip } from 'antd';
import {
  AimOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  MessageOutlined,
  PartitionOutlined,
  RollbackOutlined,
  SyncOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {
  Button as UiButton,
  Checkbox as UiCheckbox,
  InputNumber as UiInputNumber,
  Segmented as UiSegmented,
  Slider as UiSlider,
  Switch as UiSwitch,
} from 'shared-ui';

import type {
  ButtonProps,
  SparklineProps,
  CheckboxProps,
  IconProps,
  InputNumberProps,
  PressableProps,
  Primitives,
  SegmentedProps,
  SliderProps,
  SwitchProps,
  TextProps,
  TipProps,
  ViewProps,
} from '../../react/primitives/types';
import type { IconName } from '../../react/primitives/icons';
import { resolveColor, resolveSpace, resolveSty } from './resolveSty';
import { KatexFormula } from '../renderers/KatexFormula';
import { MatrixTable } from './MatrixTable';
import { PanelFrame } from './PanelFrame';
import { FlowLayout, FlowSurface, TrackGrid } from './flowLayout';
import { LossChart } from './LossChart';
import { DetailModal } from './DetailModal';
import { MermaidDiagram } from '../webOnly/MermaidDiagram';
export { flowClasses } from './flowLayout';
export { matrixTableClasses } from './MatrixTable';
import badges from './badges.module.css';

// The web renderer: mlblocks' primitives mapped onto DOM + shared-ui/antd.
// Each impl is deliberately thin — behaviour lives in the headless components;
// this file owns only platform translation (events, elements, icon set).

const ICONS: Record<IconName, ReactNode> = {
  database: <DatabaseOutlined />,
  table: <TableOutlined />,
  arrowRight: <ArrowRightOutlined />,
  aim: <AimOutlined />,
  rollback: <RollbackOutlined />,
  sync: <SyncOutlined />,
  partition: <PartitionOutlined />,
  appstore: <AppstoreOutlined />,
  code: <CodeOutlined />,
  dashboard: <DashboardOutlined />,
  message: <MessageOutlined />,
  history: <HistoryOutlined />,
  checkCircle: <CheckCircleOutlined />,
  dotPulse: <span className={`${badges.dot} ${badges.dotPulse}`} />,
  dotHollow: <span className={`${badges.dot} ${badges.dotHollow}`} />,
  // The classic JS square logo, greyscale (fills with currentColor).
  js: (
    <svg viewBox="0 0 256 256" width={14} height={14} aria-hidden focusable="false" style={{ display: 'block' }}>
      <rect width="256" height="256" rx="24" fill="currentColor" />
      <path
        fill="var(--c-bg-surface)"
        d="M67 213l20-12c4 7 7 13 15 13 8 0 13-3 13-15v-82h24v82c0 25-15 36-36 36-19 0-30-10-36-22zm85-3l20-11c5 9 12 15 24 15 10 0 17-5 17-12 0-8-7-11-18-16l-6-3c-18-8-30-17-30-37 0-18 14-32 35-32 15 0 26 5 33 19l-18 12c-4-8-9-11-15-11-7 0-11 4-11 11 0 7 4 10 15 15l6 3c21 9 33 18 33 38 0 22-17 34-40 34-22 0-37-11-44-25z"
      />
    </svg>
  ),
};

function View({ direction = 'row', inline, gap, wrap, align, justify, sty, children }: ViewProps) {
  const JUSTIFY = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' } as const;
  const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' } as const;
  return (
    <div
      style={{
        display: inline ? 'inline-flex' : 'flex',
        flexDirection: direction === 'col' ? 'column' : 'row',
        ...(gap !== undefined ? { gap: resolveSpace(gap) } : {}),
        ...(wrap ? { flexWrap: 'wrap' } : {}),
        ...(align ? { alignItems: ALIGN[align] } : {}),
        ...(justify ? { justifyContent: JUSTIFY[justify] } : {}),
        ...resolveSty(sty),
      }}
    >
      {children}
    </div>
  );
}

function Text({ sty, size, color, focusable, label, children }: TextProps) {
  return (
    <span
      tabIndex={focusable ? 0 : undefined}
      aria-label={label}
      style={{
        ...(color ? { color: resolveColor(color) } : {}),
        ...resolveSty(size ? { font: size, ...sty } : sty),
      }}
    >
      {children}
    </span>
  );
}

function Pressable({ onPress, disabled, selected, label, sty, children }: PressableProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      style={{
        // Unstyled-button reset: the headless component's Sty carries the look.
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        ...resolveSty(sty),
      }}
    >
      {children}
    </button>
  );
}

function Icon({ name, color, size }: IconProps) {
  return (
    <span
      style={{
        ...(color ? { color: resolveColor(color) } : {}),
        ...(size ? resolveSty({ font: size }) : {}),
      }}
    >
      {ICONS[name]}
    </span>
  );
}

const Tip = ({ content, children }: TipProps) => <Tooltip title={content}>{children}</Tooltip>;

const Button = ({ onPress, disabled, small, variant, label, children }: ButtonProps) => (
  <UiButton
    onClick={onPress}
    disabled={disabled}
    size={small ? 'small' : undefined}
    type={variant === 'primary' ? 'primary' : undefined}
    danger={variant === 'danger'}
    aria-label={label}
  >
    {children}
  </UiButton>
);

const Checkbox = ({ checked, onChange, disabled, children }: CheckboxProps) => (
  <UiCheckbox checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled}>
    {children}
  </UiCheckbox>
);

const Switch = ({ checked, onChange, disabled }: SwitchProps) => (
  <UiSwitch checked={checked} onChange={onChange} disabled={disabled} />
);

const Slider = ({ value, onChange, min, max, step }: SliderProps) => (
  <UiSlider value={value} onChange={onChange} min={min} max={max} step={step} />
);

const Segmented = ({ value, onChange, options }: SegmentedProps) => (
  <UiSegmented value={value} onChange={(v) => onChange(v as string)} options={options as never} />
);

const InputNumber = ({ value, onChange, min, max, step }: InputNumberProps) => (
  <UiInputNumber value={value} onChange={(v) => v != null && onChange(Number(v))} min={min} max={max} step={step} />
);

/**
 * A data-cell-sized filled line chart of one weight over training steps.
 * The area between the curve and the zero baseline is split at zero: positive
 * regions fill green, negative fill red (the signedCell convention). Sign is
 * never color-alone — being above/below the baseline carries it too. Axes are
 * bare recessive lines: the y axis on the left, the x axis on the zero line.
 */
function Sparkline({ steps, values, maxAbs, label, width = 56, height = 20 }: SparklineProps) {
  // useId is imported lazily-safe here (react, not react-dom).
  const clipId = useId();
  const pad = 1.5; // keeps the 1px stroke inside the viewBox at the extremes
  const zeroY = height / 2;
  const x0 = steps[0] ?? 0;
  const xSpan = Math.max((steps[steps.length - 1] ?? 0) - x0, 1e-9);
  const x = (step: number) => pad + ((step - x0) / xSpan) * (width - 2 * pad);
  const y = (v: number) => zeroY - (v / maxAbs) * (zeroY - pad);

  const pts = steps.map((s, k) => [x(s), y(values[k])] as const);
  const line = pts.map(([px, py]) => `${px},${py}`).join(' ');
  const area =
    pts.length > 1
      ? [
          `M ${pts[0][0]},${zeroY}`,
          ...pts.map(([px, py]) => `L ${px},${py}`),
          `L ${pts[pts.length - 1][0]},${zeroY}`,
          'Z',
        ].join(' ')
      : null;

  // The signed split is geometric: the same area/line drawn twice, clipped to
  // the half-planes above and below the zero baseline.
  const halves = [
    { id: `${clipId}-pos`, yRect: 0, hRect: zeroY, fill: resolveColor('positive') },
    { id: `${clipId}-neg`, yRect: zeroY, hRect: height - zeroY, fill: resolveColor('negative') },
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} role="img">
      {label && <title>{label}</title>}
      <defs>
        {halves.map((h) => (
          <clipPath key={h.id} id={h.id}>
            <rect x={0} y={h.yRect} width={width} height={h.hRect} />
          </clipPath>
        ))}
      </defs>
      {/* Recessive axes: y on the left edge, x on the zero-weight line. */}
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={resolveColor('borderStrong')} strokeWidth={1} />
      <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke={resolveColor('borderStrong')} strokeWidth={1} />
      {halves.map((h) => (
        <g key={h.id} clipPath={`url(#${h.id})`}>
          {area && <path d={area} fill={h.fill} fillOpacity={0.35} />}
          {pts.length > 1 ? (
            <polyline points={line} fill="none" stroke={h.fill} strokeWidth={1} />
          ) : (
            pts.length === 1 && <circle cx={pts[0][0]} cy={pts[0][1]} r={1.5} fill={h.fill} />
          )}
        </g>
      ))}
    </svg>
  );
}

/** One needle gauge: a semicircle whose needle swings to `value / scale`
 *  (left = negative, up = zero, right = positive), coloured by sign. Pure SVG,
 *  so it moves live and stays crisp. */
function Dial({ value, scale, size = 38 }: { value: number; scale: number; size?: number }) {
  const t = Math.max(-1, Math.min(1, value / (scale || 1)));
  const cx = size / 2;
  const cy = size * 0.62;
  const r = size * 0.4;
  const a = ((1 - t) * Math.PI) / 2; // t:+1→0 (right), 0→π/2 (up), −1→π (left)
  return (
    <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.78}`} aria-hidden style={{ display: 'block' }}>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--c-border-strong)"
        strokeWidth={1.5}
      />
      <line
        x1={cx}
        y1={cy}
        x2={cx + r * Math.cos(a)}
        y2={cy - r * Math.sin(a)}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: value >= 0 ? 'var(--c-positive)' : 'var(--c-error-fg)' }}
      />
      <circle cx={cx} cy={cy} r={size * 0.05} fill="var(--c-text-secondary)" />
    </svg>
  );
}

const Meter = ({ percent }: { percent: number }) => (
  <Progress percent={percent} showInfo={false} size="small" />
);

/** The web implementation of the renderer contract. The Diagram/Code slots
 *  are wired in wave C6 when the remaining DOM-lib renderers move. */
export const webPrimitives: Primitives = {
  View,
  Text,
  Pressable,
  Icon,
  Tip,
  Button,
  Checkbox,
  Switch,
  Slider,
  Segmented,
  InputNumber,
  MatrixTable,
  PanelFrame,
  FlowSurface,
  FlowLayout,
  TrackGrid,
  Sparkline,
  Dial,
  Meter,
  LossChart,
  Modal: DetailModal,
  Formula: KatexFormula,
  Diagram: ({ text }) => <MermaidDiagram chart={text} />,
};
