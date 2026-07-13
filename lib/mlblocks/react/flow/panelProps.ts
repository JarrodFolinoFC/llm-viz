import type { FlashStep } from '../../core/engine/stepTrainer';

/**
 * Props shared by the per-step training-flow panels. A view-layer type: it pairs
 * the model-agnostic flash projection ({@link FlashStep}) with the render flags
 * (`step`, `dimmed`) every shared panel takes.
 */
export interface StepPanelProps {
  vocab: readonly string[];
  step: number;
  flash: FlashStep | null;
  dimmed: boolean;
}
