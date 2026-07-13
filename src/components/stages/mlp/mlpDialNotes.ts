import { TrainingStage } from 'mlblocks';
import type { MlpFlowView } from './MlpFlowContainer';

/**
 * The "Dials" companion for the MLP parameter panels: each parameter's live
 * values rendered as needle dials by {@link DialsNote} — a matrix as a grid of
 * dials, a vector as a row of gauges. Scoped to the five parameters (E, W₁, b₁,
 * W₂, b₂) and shown only when the "Dials" view setting is on.
 */
export interface DialsSpec {
  /** LaTeX symbol for the panel title, e.g. "W_1". */
  symbol: string;
  stage: TrainingStage;
  data: (view: MlpFlowView) => {
    matrix?: number[][];
    vector?: number[];
    rowLabels?: string[];
    colLabels?: string[];
  };
}

const word = (v: MlpFlowView, i: number) => v.vocab[i] ?? `#${i}`;
const hLabels = (h: number) => Array.from({ length: h }, (_, j) => `h${j}`);
/** One label per W₁ input slot — the context word feeding it (d=1 on this page). */
const slotWords = (v: MlpFlowView) => {
  const d = v.E[0]?.length ?? 1;
  return Array.from({ length: v.W1.length }, (_, i) => word(v, v.context[Math.floor(i / d)] ?? -1));
};

export const MLP_DIAL_NOTES = {
  embeddings: {
    symbol: 'E',
    stage: TrainingStage.Parameters,
    data: (v) => ({ vector: v.E.map((r) => r[0] ?? 0), rowLabels: [...v.vocab] }),
  },
  w1: {
    symbol: 'W_1',
    stage: TrainingStage.Parameters,
    data: (v) => ({ matrix: v.W1, rowLabels: slotWords(v), colLabels: hLabels(v.W1[0]?.length ?? 0) }),
  },
  b1: {
    symbol: 'b_1',
    stage: TrainingStage.Parameters,
    data: (v) => ({ vector: v.b1, rowLabels: hLabels(v.b1.length) }),
  },
  w2: {
    symbol: 'W_2',
    stage: TrainingStage.Parameters,
    data: (v) => ({ matrix: v.W2, rowLabels: hLabels(v.W2.length), colLabels: [...v.vocab] }),
  },
  b2: {
    symbol: 'b_2',
    stage: TrainingStage.Parameters,
    data: (v) => ({ vector: v.b2, rowLabels: [...v.vocab] }),
  },

  // ── Backprop: the gradients ──
  dW1: {
    symbol: '\\nabla W_1',
    stage: TrainingStage.Backprop,
    data: (v) => ({ matrix: v.dW1, rowLabels: slotWords(v), colLabels: hLabels(v.dW1[0]?.length ?? 0) }),
  },
  dW2: {
    symbol: '\\nabla W_2',
    stage: TrainingStage.Backprop,
    data: (v) => ({ matrix: v.dW2, rowLabels: hLabels(v.dW2.length), colLabels: [...v.vocab] }),
  },
  dz1: {
    symbol: '\\nabla z_1',
    stage: TrainingStage.Backprop,
    data: (v) => ({ vector: v.dz1, rowLabels: hLabels(v.dz1.length) }),
  },
  dE: {
    symbol: '\\nabla E',
    stage: TrainingStage.Backprop,
    data: (v) => ({ vector: v.dE.map((r) => r[0] ?? 0), rowLabels: [...v.vocab] }),
  },

  // ── Update: the post-step parameters ──
  eAfter: {
    symbol: 'E',
    stage: TrainingStage.Update,
    data: (v) => ({ vector: v.Eafter.map((r) => r[0] ?? 0), rowLabels: [...v.vocab] }),
  },
  w1After: {
    symbol: 'W_1',
    stage: TrainingStage.Update,
    data: (v) => ({ matrix: v.W1after, rowLabels: slotWords(v), colLabels: hLabels(v.W1after[0]?.length ?? 0) }),
  },
  b1After: {
    symbol: 'b_1',
    stage: TrainingStage.Update,
    data: (v) => ({ vector: v.b1after, rowLabels: hLabels(v.b1after.length) }),
  },
  w2After: {
    symbol: 'W_2',
    stage: TrainingStage.Update,
    data: (v) => ({ matrix: v.W2after, rowLabels: hLabels(v.W2after.length), colLabels: [...v.vocab] }),
  },
  b2After: {
    symbol: 'b_2',
    stage: TrainingStage.Update,
    data: (v) => ({ vector: v.b2after, rowLabels: [...v.vocab] }),
  },
} satisfies Record<string, DialsSpec>;
