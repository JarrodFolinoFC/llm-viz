import type { ComponentType, CSSProperties, ReactNode } from 'react';

import type { ColorValue, FontToken, SpaceToken, Sty } from './tokens';
import type { IconName } from './icons';
import type { MatrixTableProps } from './matrixTable';
import type { Arrangement, PanelSize } from '../viewOptions';
import type { LossPoint } from '../useStepTrainer';

/**
 * The renderer contract. Headless components (mlblocks/react) render
 * exclusively through these primitives; each platform provides one
 * implementation — the web renderer (mlblocks root) maps them onto
 * shared-ui/antd/DOM, a future `mlblocks/native` onto React Native views.
 *
 * Deliberately minimal: this is the set the real components need, not a
 * design system. It grows with the wave migrations (MatrixTable in C2,
 * PanelFrame in C3, TrackGrid in C4, charts in C5) — never speculatively.
 */

export interface ViewProps {
  /** Flex layout: row (default) or column. */
  direction?: 'row' | 'col';
  /** Inline-flex (chips, badges, title fragments) instead of block flex. */
  inline?: boolean;
  gap?: SpaceToken | number;
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  sty?: Sty;
  children?: ReactNode;
}

export interface TextProps {
  sty?: Sty;
  size?: FontToken;
  color?: ColorValue;
  /** Focusable without button semantics (e.g. a defined-term tooltip trigger —
   *  keyboard-reachable, but not a pressable control). */
  focusable?: boolean;
  /** Accessible name when the visible children aren't plain text. */
  label?: string;
  children?: ReactNode;
}

export interface PressableProps {
  onPress?: () => void;
  disabled?: boolean;
  /** Toggled/active state (filter chips, segmented rows). */
  selected?: boolean;
  /** Accessible label when the children aren't self-describing text. */
  label?: string;
  sty?: Sty;
  children?: ReactNode;
}

export interface IconProps {
  name: IconName;
  color?: ColorValue;
  size?: FontToken;
}

export interface TipProps {
  content: ReactNode;
  children: ReactNode;
}

export interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  /** Compact chrome (icon-ish buttons in panel headers). */
  small?: boolean;
  /** Emphasis: the primary action, or a destructive one. */
  variant?: 'primary' | 'danger';
  label?: string;
  children?: ReactNode;
}

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

export interface SegmentedProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: ReactNode }[] | readonly T[];
}

export interface SparklineProps {
  /** Step numbers, one per value — x positions (need not be uniform). */
  steps: number[];
  /** The weight's value at each recorded step — y positions. */
  values: number[];
  /** Shared |y| domain across the whole matrix (matches signedColormap). */
  maxAbs: number;
  /** Hover label (web: a native <title>; the cell is too small for more). */
  label?: string;
  width?: number;
  height?: number;
}

export interface InputNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export interface FlowSurfaceProps {
  /** The active arrangement — renderers key their reflow behaviour off it. */
  arrangement: Arrangement;
  children?: ReactNode;
}

export interface FlowLayoutProps {
  direction: 'row' | 'col';
  gap?: SpaceToken | number;
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  /** A pipeline stage row: collapses to a column in `vertical`, dissolves into
   *  the wrap in `collapsed` (grouped columns keep their shape). */
  flowRow?: boolean;
  /** Web-only styling hook passed through from the spec. */
  className?: string;
  children?: ReactNode;
}

export interface TrackGridProps {
  nCols: number;
  rowGap?: number | string;
  columnGap?: number | string;
  rows: {
    span: boolean;
    cells: { content: ReactNode; arrow?: boolean }[];
  }[];
}

export interface PanelFrameProps {
  title: ReactNode;
  /** Resolved size (the headless Panel applies the view-options default). */
  size: PanelSize;
  dimmed?: boolean;
  /** Renderer-specific class/style pass-throughs (layout overrides). */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface LossChartProps {
  history: LossPoint[];
  /** Irreducible corpus cross-entropy — the chart's floor line. */
  floor?: number;
  /** Untrained/random-guessing cross-entropy ln(V) — the ceiling reference. */
  baseline?: number;
  /** Examples per epoch — a faint marker at each epoch boundary. */
  epochLen?: number;
  logScale: boolean;
  precision: number;
}

/** Prism-shaped syntax token — produced headless-side, rendered per platform. */
export interface CodeToken {
  type: string | null;
  content: string;
}

export interface Primitives {
  // ── structure ──
  View: ComponentType<ViewProps>;
  Text: ComponentType<TextProps>;
  Pressable: ComponentType<PressableProps>;
  Icon: ComponentType<IconProps>;
  // ── soft chrome (native default may render children unwrapped) ──
  Tip: ComponentType<TipProps>;
  // ── form controls ──
  Button: ComponentType<ButtonProps>;
  Checkbox: ComponentType<CheckboxProps>;
  Switch: ComponentType<SwitchProps>;
  Slider: ComponentType<SliderProps>;
  Segmented: ComponentType<SegmentedProps>;
  InputNumber: ComponentType<InputNumberProps>;
  // ── the table layout engine (renders the headless Grid's plan) ──
  MatrixTable: ComponentType<MatrixTableProps>;
  // ── panel chrome (title/badge/size/dimmed; web adds pin/maximize) ──
  PanelFrame: ComponentType<PanelFrameProps>;
  // ── flow layout engines (arrangement-aware rows + shared-track grids) ──
  FlowSurface: ComponentType<FlowSurfaceProps>;
  FlowLayout: ComponentType<FlowLayoutProps>;
  TrackGrid: ComponentType<TrackGridProps>;
  // ── data-in charts (the renderer draws) ──
  Sparkline: ComponentType<SparklineProps>;
  /** One needle gauge: needle swings to value/scale (left=neg, up=0, right=pos). */
  Dial: ComponentType<{ value: number; scale: number; size?: number }>;
  /** A thin horizontal progress bar (0–100). */
  Meter: ComponentType<{ percent: number }>;
  /** The loss curve with axes + reference lines (data-in; assumes ≥2 points). */
  LossChart: ComponentType<LossChartProps>;
  // ── optional chrome (absent ⇒ hosts disable the affordance) ──
  /** A mask-less floating detail dialog (click-to-open worked calculations —
   *  mask-less so clicking another row switches the working live). */
  Modal?: ComponentType<{
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    width?: number;
    children?: ReactNode;
  }>;
  // ── DOM-lib renderer slots (optional: absent ⇒ hosts fall back/skip) ──
  Formula?: ComponentType<{ tex: string; display?: boolean }>;
  Diagram?: ComponentType<{ text: string }>;
  Code?: ComponentType<{ tokens: CodeToken[] }>;
}
