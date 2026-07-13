import type { ComponentProps } from 'react';

import { softmaxRowParts, subtractMatrix, subtractVec } from 'mlblocks/core';
import type { Block, Matrix } from 'mlblocks/core';
import { StepViewModel, packSoftmaxRows, packGradientRows, paramTex, misclassifiedCount } from 'mlblocks';
import type {
  TrainingCorpus, EmbeddingMatrix, MatrixPanel, VectorPanel,
  HiddenPreActivation, RowSoftmax, GradientColumn,
} from 'mlblocks';

import {
  mlpStrategy, forwardPass, backwardPass,
  type MlpModel, type MlpFlash, type MlpStepResult,
} from '../../../training/strategies/mlp';
import { contextSlots, hiddenLabels, posSlotLabels, stillRandomInit, w1RowLabels, weightsPhase } from './mlpLabels';
import type { W1Matrix } from './W1Matrix';
import type { EmbUpdateWorking } from './EmbUpdateWorking';
import type { WeightUpdateWorking } from './WeightUpdateWorking';
import type { BiasUpdateWorking } from './BiasUpdateWorking';

/**
 * The MLP flow's raw view surface — every value the notes and the overview
 * chart read. {@link MlpViewModel} implements it (as lazy getters), so those
 * consumers stay decoupled from the class.
 */
export interface MlpFlowView {
  vocab: readonly string[];
  corpus: string;
  examplesLength: number;
  step: number;
  dimmed: boolean;
  flash: MlpFlash | null;
  /** Index of the trained block's target token within the corpus. */
  targetPos: number;
  lr: number;
  /** The N context token ids of the displayed example. */
  context: number[];
  /** The target (next) token id of the displayed example. */
  target: number;
  // Weights the displayed forward/backward was computed with (pre-update on a flash).
  E: Matrix;
  W1: Matrix;
  b1: number[];
  W2: Matrix;
  b2: number[];
  // Forward intermediates for the displayed example.
  x: number[];
  /** H hidden pre-activations z₁ = x·W₁ + b₁ (before tanh). */
  z1: number[];
  hidden: number[];
  logits: number[];
  /** [logit, eˣ, prob] per next-token slot — for RowSoftmax. */
  softmaxRows: number[][];
  /** [prob, y, p−y] per next-token slot — for GradientColumn. */
  gradientRows: number[][];
  // Backprop gradients for the displayed example.
  dW2: Matrix;
  dHidden: number[];
  dz1: number[];
  dW1: Matrix;
  dE: Matrix;
  // Post-update weights + their deltas — for the update row.
  Eafter: Matrix;
  W1after: Matrix;
  b1after: number[];
  W2after: Matrix;
  b2after: number[];
  deltaE: Matrix;
  deltaW1: Matrix;
  deltaB1: number[];
  deltaW2: Matrix;
  deltaB2: number[];
}

/** The run's step-independent inputs (memoised by the container). */
export interface MlpRunStatics {
  vocab: readonly string[];
  corpus: string;
  /** The corpus's N-token training blocks — the trainer's examples. */
  blocks: Block[];
  /** Context block size N (the targetPos fallback before any flash). */
  blockSize: number;
}

/**
 * The forward-pass slot(s) a context token feeds, as a muted row note on the E
 * panel — e.g. "→ x[1] · pos1". Only shown for the scalar stage's 1-d
 * embeddings, where a token fills exactly one x component per position (so the
 * hop from E[tok] to the `x ⊙ W₁` row headed `E[tok][0]` is readable without
 * hovering). Returns null for tokens not in the current context, and for d > 1
 * (the full MLP stage), where the slot spans d components and the tag would
 * only clutter.
 */
function contextSlotNote(context: readonly number[], tok: number, d: number): string | null {
  if (d !== 1) return null;
  const slots = context.flatMap((c, p) => (c === tok ? [`x[${p}] · pos${p}`] : []));
  return slots.length ? `→ ${slots.join(', ')}` : null;
}

/**
 * Every piece of the MLP flow's derived UI state as one pure object — the raw
 * {@link MlpFlowView} surface (notes / chart) plus a typed props
 * getter per panel (the flow spec's bindings). Built once per training step
 * from the trainer's output; see {@link StepViewModel} for the caching
 * contract (lazy, compute-once, immutable per step).
 */
export class MlpViewModel extends StepViewModel implements MlpFlowView {
  constructor(
    private readonly statics: MlpRunStatics,
    private readonly r: MlpStepResult,
    readonly lr: number,
  ) {
    super();
  }

  // ── The run/step scalars ──
  get vocab(): readonly string[] { return this.statics.vocab; }
  get corpus(): string { return this.statics.corpus; }
  get examplesLength(): number { return this.statics.blocks.length; }
  get step(): number { return this.r.step; }
  get flash(): MlpFlash | null { return this.r.flash; }
  /** Step 0 is the untrained init — panels render hints, not live values. */
  get dimmed(): boolean { return this.r.step === 0; }
  get target(): number { return this.r.currentPair.target; }
  /** Corpus position of the trained block's target: flash.pos is the last
   *  context token, so +1. (pairIdx would be wrong under a shuffled order.) */
  get targetPos(): number { return (this.r.flash?.pos ?? this.statics.blockSize - 1) + 1; }

  // ── The displayed example and its forward/backward pass ──
  // On a single step the worked example is replayed on the pre-update weights;
  // otherwise the current model forward-passes the current block (dimmed).

  private get shownModel(): MlpModel { return this.r.flash ? this.r.before : this.r.after; }
  private get block(): Block { return this.statics.blocks[this.r.pairIdx] ?? this.statics.blocks[0]; }

  get context(): number[] {
    return this.memo('context', () => this.r.flash?.context ?? this.block.context);
  }

  private get forward() {
    return this.memo('forward', () => this.r.flash?.forward ?? forwardPass(this.shownModel, this.context));
  }

  private get grads() {
    return this.memo('grads', () => this.r.flash?.grads ?? backwardPass(this.shownModel, this.block, this.forward));
  }

  // ── The raw view surface ──

  get E(): Matrix { return this.shownModel.E; }
  get W1(): Matrix { return this.shownModel.W1; }
  get b1(): number[] { return this.shownModel.b1; }
  get W2(): Matrix { return this.shownModel.W2; }
  get b2(): number[] { return this.shownModel.b2; }

  get x(): number[] { return this.forward.x; }
  get z1(): number[] { return this.forward.z1; }
  get hidden(): number[] { return this.forward.hidden; }
  get logits(): number[] { return this.forward.logits; }

  get softmaxRows(): number[][] {
    return this.memo('softmaxRows', () => {
      const { exps } = softmaxRowParts(this.logits);
      return packSoftmaxRows(this.logits, exps, this.forward.probs);
    });
  }

  get gradientRows(): number[][] {
    return this.memo('gradientRows', () =>
      packGradientRows(this.forward.probs, this.grads.dLogits, this.target));
  }

  get dW2(): Matrix { return this.grads.dW2; }
  get dHidden(): number[] { return this.grads.dHidden; }
  get dz1(): number[] { return this.grads.dz1; }
  get dW1(): Matrix { return this.grads.dW1; }
  get dE(): Matrix { return this.grads.dE; }

  get Eafter(): Matrix { return this.r.after.E; }
  get W1after(): Matrix { return this.r.after.W1; }
  get b1after(): number[] { return this.r.after.b1; }
  get W2after(): Matrix { return this.r.after.W2; }
  get b2after(): number[] { return this.r.after.b2; }

  get deltaE(): Matrix { return this.memo('deltaE', () => subtractMatrix(this.r.after.E, this.r.before.E)); }
  get deltaW1(): Matrix { return this.memo('deltaW1', () => subtractMatrix(this.r.after.W1, this.r.before.W1)); }
  get deltaB1(): number[] { return this.memo('deltaB1', () => subtractVec(this.r.after.b1, this.r.before.b1)); }
  get deltaW2(): Matrix { return this.memo('deltaW2', () => subtractMatrix(this.r.after.W2, this.r.before.W2)); }
  get deltaB2(): number[] { return this.memo('deltaB2', () => subtractVec(this.r.after.b2, this.r.before.b2)); }

  // ── Panel props (typed against the components, so the wiring is checked) ──

  private get d(): number { return this.E[0]?.length ?? 0; }

  get corpusPanel(): ComponentProps<typeof TrainingCorpus> {
    return this.memo('corpusPanel', () => ({
      step: this.step, corpus: this.corpus,
      pairIdx: this.targetPos - 1, contextLen: this.context.length,
    }));
  }

  get ePanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('ePanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed, randomInit: stillRandomInit(this.step),
      symbol: paramTex('E', 'E'),
      phase: this.step === 0 ? 'random init — untrained' : 'context rows',
      matrix: this.E, highlightedRows: this.context,
      rowNote: (i: number) => contextSlotNote(this.context, i, this.d),
    }));
  }

  get w1Panel(): ComponentProps<typeof W1Matrix> {
    return this.memo('w1Panel', () => ({
      vocab: this.vocab, context: this.context, E: this.E, W1: this.W1,
      step: this.step, dimmed: this.dimmed,
    }));
  }

  get b1Panel(): ComponentProps<typeof VectorPanel> {
    return this.memo('b1Panel', () => ({
      symbol: paramTex('b1', 'b_1'), phase: 'H — hidden bias', step: this.step, dimmed: this.dimmed,
      values: this.b1, rowHeadings: hiddenLabels(this.b1.length),
      compact: true,
    }));
  }

  get w2Panel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('w2Panel', () => ({
      symbol: paramTex('W2', 'W_2'), phase: weightsPhase('H×V', this.step), step: this.step, dimmed: this.dimmed,
      randomInit: stillRandomInit(this.step), matrix: this.W2,
      rowHeadings: hiddenLabels(this.W2.length), columnHeaders: [...this.vocab],
    }));
  }

  // b₂ takes part in every logit (logits = h·W₂ + b₂), so it must be on
  // screen for the logit column to be recomputable from the visible panels.
  get b2Panel(): ComponentProps<typeof VectorPanel> {
    return this.memo('b2Panel', () => ({
      symbol: paramTex('b2', 'b_2'), phase: 'V — output bias', step: this.step, dimmed: this.dimmed,
      values: this.b2, rowHeadings: [...this.vocab],
      compact: true,
    }));
  }

  // The whole hidden computation in one panel: the x⊙W₁ per-unit products, then
  // stacked rollups carrying each unit's column down through Σ = x·W₁, b₁,
  // z₁ = x·W₁+b₁ and h = tanh(z₁).
  get preActivationPanel(): ComponentProps<typeof HiddenPreActivation> {
    return this.memo('preActivationPanel', () => ({
      slots: contextSlots(this.vocab, this.context, this.d),
      posLabels: posSlotLabels(this.context, this.d),
      x: this.x, W1: this.W1, b1: this.b1, z1: this.z1, hidden: this.hidden,
      step: this.step, dimmed: this.dimmed,
    }));
  }

  get softmaxPanel(): ComponentProps<typeof RowSoftmax> {
    return this.memo('softmaxPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed, matrix: this.softmaxRows,
      logitLabel: 'ℓ = h·W₂+b₂', logitSymbol: '\\ell', contextTokens: this.context,
      // Click a candidate row → its worked logit (h·W₂+b₂) and softmax.
      logitParts: { hidden: this.hidden, W2: this.W2, b2: this.b2, hiddenLabels: hiddenLabels(this.hidden.length) },
    }));
  }

  get gradientPanel(): ComponentProps<typeof GradientColumn> {
    return this.memo('gradientPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed, matrix: this.gradientRows,
      logitSymbol: '\\ell', contextTokens: this.context,
    }));
  }

  get dW2Panel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('dW2Panel', () => ({
      symbol: `\\nabla ${paramTex('W2', 'W_2')}`, phase: 'H×V', step: this.step, dimmed: this.dimmed,
      matrix: this.dW2, rowHeadings: hiddenLabels(this.dW2.length), columnHeaders: [...this.vocab],
    }));
  }

  get dz1Panel(): ComponentProps<typeof VectorPanel> {
    return this.memo('dz1Panel', () => ({
      symbol: '\\nabla z_1', phase: 'H', step: this.step, dimmed: this.dimmed,
      values: this.dz1,
    }));
  }

  get dW1Panel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('dW1Panel', () => ({
      symbol: `\\nabla ${paramTex('W1', 'W_1')}`, phase: 'D×H', step: this.step, dimmed: this.dimmed,
      matrix: this.dW1, rowHeadings: w1RowLabels(this.vocab, this.context, this.d),
      columnHeaders: hiddenLabels(this.dW1[0]?.length ?? 0),
      rowHeadingMinWidth: '8ch',
    }));
  }

  get dEPanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('dEPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed,
      symbol: `\\nabla ${paramTex('E', 'E')}`, phase: 'context rows',
      matrix: this.dE, highlightedRows: this.context,
    }));
  }

  get w1AfterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('w1AfterPanel', () => ({
      symbol: paramTex('W1', 'W_1'), phase: 'after step', step: this.step, dimmed: this.dimmed,
      matrix: this.W1after, deltas: this.deltaW1,
      rowHeadings: w1RowLabels(this.vocab, this.context, this.d),
      columnHeaders: hiddenLabels(this.W1after[0]?.length ?? 0),
      rowHeadingMinWidth: '8ch',
    }));
  }

  get b1AfterPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('b1AfterPanel', () => ({
      symbol: paramTex('b1', 'b_1'), phase: 'after step', step: this.step, dimmed: this.dimmed,
      values: this.b1after, deltas: this.deltaB1, rowHeadings: hiddenLabels(this.b1after.length),
      compact: true,
    }));
  }

  get w2AfterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('w2AfterPanel', () => ({
      symbol: paramTex('W2', 'W_2'), phase: 'after step', step: this.step, dimmed: this.dimmed,
      matrix: this.W2after, deltas: this.deltaW2,
      rowHeadings: hiddenLabels(this.W2after.length), columnHeaders: [...this.vocab],
    }));
  }

  get b2AfterPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('b2AfterPanel', () => ({
      symbol: paramTex('b2', 'b_2'), phase: 'after step', step: this.step, dimmed: this.dimmed,
      values: this.b2after, deltas: this.deltaB2, rowHeadings: [...this.vocab],
      compact: true,
    }));
  }

  get eAfterPanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('eAfterPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed,
      symbol: paramTex('E', 'E'), phase: 'after step',
      matrix: this.Eafter, deltas: this.deltaE, highlightedRows: this.context,
    }));
  }

  // The update panels, worked out — scalar stage only.

  get embWorkingPanel(): ComponentProps<typeof EmbUpdateWorking> {
    return this.memo('embWorkingPanel', () => ({
      vocab: this.vocab, context: this.context, E: this.E, W1: this.W1, dz1: this.dz1,
      deltaE: this.deltaE, Eafter: this.Eafter, lr: this.lr, step: this.step, dimmed: this.dimmed,
    }));
  }

  // ∇W₁ = x ⊗ ∇z₁ (outer product): x[i] on rows, ∇z₁[j] on columns.
  get w1WorkingPanel(): ComponentProps<typeof WeightUpdateWorking> {
    return this.memo('w1WorkingPanel', () => ({
      title: `\\nabla ${paramTex('W1', 'W_1')} = x \\otimes \\nabla z_1`,
      rowFactor: this.x, rowLabels: w1RowLabels(this.vocab, this.context, this.d),
      colFactor: this.dz1, colLabels: hiddenLabels(this.dz1.length),
      deltas: this.deltaW1, lr: this.lr, step: this.step, dimmed: this.dimmed,
      rowHeadingMinWidth: '8ch',
    }));
  }

  // ∇b₁ = ∇z₁ (identical): the hidden pre-activation gradient IS the bias gradient.
  get b1WorkingPanel(): ComponentProps<typeof BiasUpdateWorking> {
    return this.memo('b1WorkingPanel', () => ({
      title: `\\Delta ${paramTex('b1', 'b_1')} = -\\eta\\,\\nabla ${paramTex('b1', 'b_1')}`,
      rowLabels: hiddenLabels(this.b1.length),
      decomposition: [{ label: '∇z₁ = ∇b₁', values: this.dz1 }],
      deltas: this.deltaB1, before: this.b1, after: this.b1after,
      lr: this.lr, step: this.step, dimmed: this.dimmed,
    }));
  }

  // ∇W₂ = h ⊗ (p−y): h[j] on rows, (p−y)[k] on columns.
  get w2WorkingPanel(): ComponentProps<typeof WeightUpdateWorking> {
    return this.memo('w2WorkingPanel', () => ({
      title: `\\nabla ${paramTex('W2', 'W_2')} = h \\otimes (p-y)`,
      rowFactor: this.hidden, rowLabels: hiddenLabels(this.hidden.length),
      colFactor: this.gradientRows.map((r) => r[2]), colLabels: [...this.vocab],
      deltas: this.deltaW2, lr: this.lr, step: this.step, dimmed: this.dimmed,
    }));
  }

  // ∇b₂ = p − y (the output gradient itself); show p and y building up to it.
  get b2WorkingPanel(): ComponentProps<typeof BiasUpdateWorking> {
    return this.memo('b2WorkingPanel', () => ({
      title: `\\Delta ${paramTex('b2', 'b_2')} = -\\eta\\,\\nabla ${paramTex('b2', 'b_2')}`,
      rowLabels: [...this.vocab],
      decomposition: [
        { label: 'p', values: this.gradientRows.map((r) => r[0]), muted: true },
        { label: 'y', values: this.gradientRows.map((r) => r[1]), muted: true },
        { label: 'p − y = ∇b₂', values: this.gradientRows.map((r) => r[2]) },
      ],
      deltas: this.deltaB2, before: this.b2, after: this.b2after,
      lr: this.lr, step: this.step, dimmed: this.dimmed,
    }));
  }

  // ── Stage-shell readouts ──

  get meanLoss(): number {
    return this.memo('meanLoss', () => mlpStrategy.loss(this.r.after, this.statics.blocks));
  }

  /** Blocks the post-step model still gets wrong (argmax ≠ target). */
  get misclassified(): number {
    return this.memo('misclassified', () =>
      misclassifiedCount(this.statics.blocks, (b) => forwardPass(this.r.after, b.context).probs));
  }

  /** The JS-console scope for this step's worked example. */
  get scope(): Record<string, unknown> {
    return this.memo('scope', () => ({
      E: this.r.after.E, W1: this.r.after.W1, b1: this.r.after.b1,
      W2: this.r.after.W2, b2: this.r.after.b2,
      Ebefore: this.r.before.E, W1before: this.r.before.W1, W2before: this.r.before.W2,
    }));
  }
}
