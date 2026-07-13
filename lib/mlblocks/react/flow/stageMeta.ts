import { TrainingStage } from '../../core/stage';
import type { IconName } from '../primitives/icons';

export interface StageMeta {
  /** Human-readable name, shown as the badge tooltip. */
  label: string;
  /** Renderer-neutral icon name (each renderer maps it to its icon set). */
  icon: IconName;
  /** The stage's signature colour (hex), used to tint its icon and diagram group. */
  color: string;
}

/** Label, icon name, and signature colour for each {@link TrainingStage} —
 *  the single source the renderers (and the app's flowcharts) derive from. */
export const STAGE_META: Record<TrainingStage, StageMeta> = {
  [TrainingStage.Data]: { label: 'Data', icon: 'database', color: '#FF8C00' },
  // Royal blue rather than midnight blue: the stage colour is used as a
  // foreground tint (badge icon, mermaid stroke), and #191970 was almost
  // invisible on a dark background. This reads on both light and dark surfaces.
  [TrainingStage.Parameters]: { label: 'Parameters', icon: 'table', color: '#4169E1' },
  [TrainingStage.Forward]: { label: 'Forward pass', icon: 'arrowRight', color: '#9370DB' },
  // No colour was specified for Loss; crimson keeps it distinct (error = red).
  [TrainingStage.Loss]: { label: 'Loss', icon: 'aim', color: '#DC143C' },
  [TrainingStage.Backprop]: { label: 'Back propagation', icon: 'rollback', color: '#CD7F32' },
  [TrainingStage.Update]: { label: 'Update', icon: 'sync', color: '#FFBF00' },
  // Meta stage for the flow-chart overview; slate keeps it neutral vs the phases.
  [TrainingStage.Overview]: { label: 'Overview', icon: 'partition', color: '#475569' },
};
