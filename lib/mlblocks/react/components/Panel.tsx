import type { CSSProperties, ReactNode } from 'react';

import { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { useViewOptions, type PanelSize } from '../viewOptions';
import { LiveBadge } from './LiveBadge';

export interface PanelProps {
  title: ReactNode;
  dimmed: boolean;
  step: number;
  /** Override the global panel size for this panel; defaults to the View setting. */
  size?: PanelSize;
  /** Extra class(es) merged onto the frame — e.g. layout overrides from a module. */
  className?: string;
  style?: CSSProperties;
  /** Which phase of the training step this panel belongs to (drives the badge icon). */
  stage?: TrainingStage;
  /** The values shown are still the untouched random init (purple badge dot). */
  randomInit?: boolean;
  children: ReactNode;
}

/**
 * The framework panel: a live training badge composed into the title, the
 * global panel size from the view options, and whatever chrome the renderer's
 * PanelFrame adds (on web: the shared-ui card plus pin/maximize actions).
 */
export function Panel({ title, dimmed = false, className, style, step, size, stage, randomInit, children }: PanelProps) {
  const P = useP();
  const { panelSize } = useViewOptions();
  return (
    <P.PanelFrame
      title={
        <>
          <LiveBadge step={step} stage={stage} randomInit={randomInit} />
          {title}
        </>
      }
      size={size ?? panelSize}
      dimmed={dimmed}
      className={className}
      style={style}
    >
      {children}
    </P.PanelFrame>
  );
}
