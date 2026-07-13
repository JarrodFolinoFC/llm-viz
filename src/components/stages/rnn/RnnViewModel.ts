import type { ComponentProps } from 'react';

import { softmaxRowParts, subtractMatrix } from 'mlblocks/core';
import type { Block, Matrix } from 'mlblocks/core';
import { StepViewModel, packSoftmaxRows, packGradientRows, misclassifiedCount } from 'mlblocks';
import type {
  TrainingCorpus, EmbeddingMatrix, MatrixPanel, VectorPanel, RowSoftmax, GradientColumn,
} from 'mlblocks';

import {
  rnnStrategy, forwardPass, backwardPass,
  type RnnModel, type RnnFlash, type RnnStepResult,
} from '../../../training/strategies/rnn';

/**
 * The RNN flow's raw view surface — every value the overview chart reads.
 * {@link RnnViewModel} implements it (as lazy getters).
 */
export interface RnnFlowView {
  vocab: readonly string[];
  corpus: string;
  examplesLength: number;
  step: number;
  dimmed: boolean;
  flash: RnnFlash | null;
  /** Index of the trained block's target token within the corpus. */
  targetPos: number;
  lr: number;
  /** The N context token ids of the displayed example (oldest → newest). */
  context: number[];
  /** The target (next) token id of the displayed example. */
  target: number;
  // Weights the displayed forward/backward was computed with (pre-update on a flash).
  E: Matrix;
  Wxh: Matrix;
  Whh: Matrix;
  bh: number[];
  Why: Matrix;
  by: number[];
  // Forward intermediates for the displayed example.
  /** N × H — the hidden state after each step (the recurrence, unrolled). */
  hiddens: Matrix;
  /** H — the final hidden state h_N that feeds the read-out. */
  hN: number[];
  logits: number[];
  /** [logit, eˣ, prob] per next-token slot — for RowSoftmax. */
  softmaxRows: number[][];
  /** [prob, y, p−y] per next-token slot — for GradientColumn. */
  gradientRows: number[][];
  // Backprop gradients for the displayed example.
  dWhy: Matrix;
  dWxh: Matrix;
  dWhh: Matrix;
  dE: Matrix;
  // Post-update weights + their deltas — for the update row.
  Eafter: Matrix;
  Wxhafter: Matrix;
  Whhafter: Matrix;
  Whyafter: Matrix;
  deltaE: Matrix;
  deltaWxh: Matrix;
  deltaWhh: Matrix;
  deltaWhy: Matrix;
}

/** The run's step-independent inputs (memoised by the container). */
export interface RnnRunStatics {
  vocab: readonly string[];
  corpus: string;
  /** The corpus's N-token training blocks — the trainer's examples. */
  blocks: Block[];
  /** Context length N (the targetPos fallback before any flash). */
  blockSize: number;
}

/** Labels for the H hidden units (W_xh / W_hy columns, W_hh both axes). */
const hiddenLabels = (h: number) => Array.from({ length: h }, (_, j) => `h${j}`);

/** Labels for the d embedding components fed in at each step (W_xh's rows). */
const inputDimLabels = (d: number) =>
  d <= 1 ? ['x'] : Array.from({ length: d }, (_, j) => `x${j}`);

/**
 * Row labels for the hidden-state matrix: one row per recurrence step, tagged
 * with the token read at that step, so the matrix reads as "the running state
 * after the, then after cat, …".
 */
const stepLabels = (vocab: readonly string[], context: number[]) =>
  context.map((c, i) => `t${i + 1}: ${vocab[c]}`);

/**
 * Every piece of the RNN flow's derived UI state as one pure object — the raw
 * {@link RnnFlowView} surface (the chart) plus a typed props getter per panel
 * (the flow spec's bindings). Built once per training step from the trainer's
 * output; see {@link StepViewModel} for the caching contract.
 */
export class RnnViewModel extends StepViewModel implements RnnFlowView {
  constructor(
    private readonly statics: RnnRunStatics,
    private readonly r: RnnStepResult,
    readonly lr: number,
  ) {
    super();
  }

  // ── The run/step scalars ──
  get vocab(): readonly string[] { return this.statics.vocab; }
  get corpus(): string { return this.statics.corpus; }
  get examplesLength(): number { return this.statics.blocks.length; }
  get step(): number { return this.r.step; }
  get flash(): RnnFlash | null { return this.r.flash; }
  /** Step 0 is the untrained init — panels render hints, not live values. */
  get dimmed(): boolean { return this.r.step === 0; }
  get target(): number { return this.r.currentPair.target; }
  /** Corpus position of the trained block's target: flash.pos is the last
   *  context token, so +1. (pairIdx would be wrong under a shuffled order.) */
  get targetPos(): number { return (this.r.flash?.pos ?? this.statics.blockSize - 1) + 1; }

  // ── The displayed example and its forward/backward pass ──
  // On a single step the worked example is replayed on the pre-update weights;
  // otherwise the current model forward-passes the current block (dimmed).

  private get shownModel(): RnnModel { return this.r.flash ? this.r.before : this.r.after; }
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
  get Wxh(): Matrix { return this.shownModel.Wxh; }
  get Whh(): Matrix { return this.shownModel.Whh; }
  get bh(): number[] { return this.shownModel.bh; }
  get Why(): Matrix { return this.shownModel.Why; }
  get by(): number[] { return this.shownModel.by; }

  get hiddens(): Matrix { return this.forward.hiddens; }
  get hN(): number[] { return this.forward.hN; }
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

  get dWhy(): Matrix { return this.grads.dWhy; }
  get dWxh(): Matrix { return this.grads.dWxh; }
  get dWhh(): Matrix { return this.grads.dWhh; }
  get dE(): Matrix { return this.grads.dE; }

  get Eafter(): Matrix { return this.r.after.E; }
  get Wxhafter(): Matrix { return this.r.after.Wxh; }
  get Whhafter(): Matrix { return this.r.after.Whh; }
  get Whyafter(): Matrix { return this.r.after.Why; }

  get deltaE(): Matrix { return this.memo('deltaE', () => subtractMatrix(this.r.after.E, this.r.before.E)); }
  get deltaWxh(): Matrix { return this.memo('deltaWxh', () => subtractMatrix(this.r.after.Wxh, this.r.before.Wxh)); }
  get deltaWhh(): Matrix { return this.memo('deltaWhh', () => subtractMatrix(this.r.after.Whh, this.r.before.Whh)); }
  get deltaWhy(): Matrix { return this.memo('deltaWhy', () => subtractMatrix(this.r.after.Why, this.r.before.Why)); }

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
      vocab: this.vocab, step: this.step, dimmed: this.dimmed, randomInit: this.step <= 1,
      symbol: 'E',
      phase: this.step === 0 ? 'random init — untrained' : 'context rows',
      matrix: this.E, highlightedRows: this.context,
    }));
  }

  get wxhPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('wxhPanel', () => ({
      symbol: 'W_xh', phase: 'd×H', step: this.step, dimmed: this.dimmed,
      randomInit: this.step <= 1, matrix: this.Wxh,
      rowHeadings: inputDimLabels(this.d),
      columnHeaders: hiddenLabels(this.Wxh[0]?.length ?? 0),
    }));
  }

  get whhPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('whhPanel', () => ({
      symbol: 'W_hh', phase: 'H×H', step: this.step, dimmed: this.dimmed,
      randomInit: this.step <= 1, matrix: this.Whh,
      rowHeadings: hiddenLabels(this.Whh.length),
      columnHeaders: hiddenLabels(this.Whh[0]?.length ?? 0),
    }));
  }

  // b_h is added inside every recurrence step, so it must be on screen for the
  // hidden states to be recomputable from the visible panels.
  get bhPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('bhPanel', () => ({
      symbol: 'b_h', phase: 'H — hidden bias', step: this.step, dimmed: this.dimmed,
      values: this.bh, rowHeadings: hiddenLabels(this.bh.length),
    }));
  }

  get whyPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('whyPanel', () => ({
      symbol: 'W_hy', phase: 'H×V', step: this.step, dimmed: this.dimmed,
      randomInit: this.step <= 1, matrix: this.Why,
      rowHeadings: hiddenLabels(this.Why.length), columnHeaders: [...this.vocab],
    }));
  }

  // b_y takes part in every logit (logits = h_N·W_hy + b_y) — see b_h above.
  get byPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('byPanel', () => ({
      symbol: 'b_y', phase: 'V — output bias', step: this.step, dimmed: this.dimmed,
      values: this.by, rowHeadings: [...this.vocab],
    }));
  }

  // Forward — fold each token into the running hidden state, read out the last.
  get hiddensPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('hiddensPanel', () => ({
      symbol: 'H', phase: 'hₜ per step', step: this.step, dimmed: this.dimmed, matrix: this.hiddens,
      rowHeadings: stepLabels(this.vocab, this.context),
      columnHeaders: hiddenLabels(this.hiddens[0]?.length ?? 0),
      rowHeadingMinWidth: '8ch',
    }));
  }

  get softmaxPanel(): ComponentProps<typeof RowSoftmax> {
    return this.memo('softmaxPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed,
      matrix: this.softmaxRows, logitLabel: 'x = h_N·W_hy+b_y',
    }));
  }

  // Backprop through time: p − y → ∇W_hy → ∇h_N → … → ∇W_xh, ∇W_hh → ∇E.
  get gradientPanel(): ComponentProps<typeof GradientColumn> {
    return this.memo('gradientPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed,
      matrix: this.gradientRows,
    }));
  }

  get dWhyPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('dWhyPanel', () => ({
      symbol: '\\nabla W_hy', phase: 'H×V', step: this.step, dimmed: this.dimmed, matrix: this.dWhy,
      rowHeadings: hiddenLabels(this.dWhy.length), columnHeaders: [...this.vocab],
    }));
  }

  get dWxhPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('dWxhPanel', () => ({
      symbol: '\\nabla W_xh', phase: 'd×H', step: this.step, dimmed: this.dimmed, matrix: this.dWxh,
      rowHeadings: inputDimLabels(this.d),
      columnHeaders: hiddenLabels(this.dWxh[0]?.length ?? 0),
    }));
  }

  get dWhhPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('dWhhPanel', () => ({
      symbol: '\\nabla W_hh', phase: 'H×H', step: this.step, dimmed: this.dimmed, matrix: this.dWhh,
      rowHeadings: hiddenLabels(this.dWhh.length),
      columnHeaders: hiddenLabels(this.dWhh[0]?.length ?? 0),
    }));
  }

  get dEPanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('dEPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed, symbol: '\\nabla E', phase: 'context rows',
      matrix: this.dE, highlightedRows: this.context,
    }));
  }

  // Update: W ← W − η·∇W.
  get wxhAfterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('wxhAfterPanel', () => ({
      symbol: 'W_xh', phase: 'after step', step: this.step, dimmed: this.dimmed,
      matrix: this.Wxhafter, deltas: this.deltaWxh,
      rowHeadings: inputDimLabels(this.d),
      columnHeaders: hiddenLabels(this.Wxhafter[0]?.length ?? 0),
    }));
  }

  get whhAfterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('whhAfterPanel', () => ({
      symbol: 'W_hh', phase: 'after step', step: this.step, dimmed: this.dimmed,
      matrix: this.Whhafter, deltas: this.deltaWhh,
      rowHeadings: hiddenLabels(this.Whhafter.length),
      columnHeaders: hiddenLabels(this.Whhafter[0]?.length ?? 0),
    }));
  }

  get whyAfterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('whyAfterPanel', () => ({
      symbol: 'W_hy', phase: 'after step', step: this.step, dimmed: this.dimmed,
      matrix: this.Whyafter, deltas: this.deltaWhy,
      rowHeadings: hiddenLabels(this.Whyafter.length), columnHeaders: [...this.vocab],
    }));
  }

  get eAfterPanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('eAfterPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed, symbol: 'E', phase: 'after step',
      matrix: this.Eafter, deltas: this.deltaE, highlightedRows: this.context,
    }));
  }

  // ── Stage-shell readouts ──

  get meanLoss(): number {
    return this.memo('meanLoss', () => rnnStrategy.loss(this.r.after, this.statics.blocks));
  }

  /** Blocks the post-step model still gets wrong (argmax ≠ target). */
  get misclassified(): number {
    return this.memo('misclassified', () =>
      misclassifiedCount(this.statics.blocks, (b) => forwardPass(this.r.after, b.context).probs));
  }

  /** The JS-console scope for this step's worked example. */
  get scope(): Record<string, unknown> {
    return this.memo('scope', () => ({
      E: this.r.after.E, Wxh: this.r.after.Wxh, Whh: this.r.after.Whh,
      bh: this.r.after.bh, Why: this.r.after.Why, by: this.r.after.by,
      Ebefore: this.r.before.E, Wxhbefore: this.r.before.Wxh,
      Whhbefore: this.r.before.Whh, Whybefore: this.r.before.Why,
    }));
  }
}
