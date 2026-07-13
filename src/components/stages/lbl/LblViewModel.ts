import type { ComponentProps } from 'react';

import { subtractMatrix, subtractVec, softmaxRowParts } from 'mlblocks/core';
import type { Block, Matrix } from 'mlblocks/core';
import { StepViewModel, packSoftmaxRows, packGradientRows, misclassifiedCount, paramTex } from 'mlblocks';
import type { TrainingCorpus, EmbeddingMatrix, MatrixPanel, VectorPanel, RowSoftmax, GradientColumn } from 'mlblocks';

import {
  lblStrategy, forwardPass, backwardPass,
  type LblModel, type LblFlash, type LblStepResult,
} from '../../../training/strategies/lbl';
import { stillRandomInit, w1RowLabels, weightsPhase } from '../mlp/mlpLabels';
import type { WeightUpdateWorking } from '../mlp/WeightUpdateWorking';
import type { BiasUpdateWorking } from '../mlp/BiasUpdateWorking';

/** The run's step-independent inputs (memoised by the container). */
export interface LblRunStatics {
  vocab: readonly string[];
  corpus: string;
  /** The corpus's N-token training blocks — the trainer's examples. */
  blocks: Block[];
  /** Context block size N (the targetPos fallback before any flash). */
  blockSize: number;
}

/**
 * The forward-pass slot a context token feeds, as a muted row note on the E
 * panel — same convention as the MLP scalar stage (d = 1 only, where each
 * token fills exactly one x component per position).
 */
function contextSlotNote(context: readonly number[], tok: number, d: number): string | null {
  if (d !== 1) return null;
  const slots = context.flatMap((c, p) => (c === tok ? [`x[${p}] · pos${p}`] : []));
  return slots.length ? `→ ${slots.join(', ')}` : null;
}

/**
 * Every piece of the log-bilinear flow's derived UI state, as one pure object
 * — the Bengio MLP's view-model with the hidden layer deleted: embed,
 * concatenate, project straight to logits. See {@link StepViewModel} for the
 * caching contract.
 */
export class LblViewModel extends StepViewModel {
  constructor(
    private readonly statics: LblRunStatics,
    private readonly r: LblStepResult,
    readonly lr: number,
  ) {
    super();
  }

  // ── The run/step scalars ──
  get vocab(): readonly string[] { return this.statics.vocab; }
  get corpus(): string { return this.statics.corpus; }
  get examplesLength(): number { return this.statics.blocks.length; }
  get step(): number { return this.r.step; }
  get flash(): LblFlash | null { return this.r.flash; }
  /** Step 0 is the untrained init — panels render hints, not live values. */
  get dimmed(): boolean { return this.r.step === 0; }
  get target(): number { return this.r.currentPair.target; }
  /** Corpus position of the trained block's target: flash.pos is the last
   *  context token, so +1. */
  get targetPos(): number { return (this.r.flash?.pos ?? this.statics.blockSize - 1) + 1; }

  // ── The displayed example and its forward/backward pass ──
  // On a single step the worked example is replayed on the pre-update weights;
  // otherwise the current model forward-passes the current block (dimmed).

  private get shownModel(): LblModel { return this.r.flash ? this.r.before : this.r.after; }
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

  private get d(): number { return this.shownModel.E[0]?.length ?? 0; }

  // ── Shared intermediates ──

  get softmaxRows(): number[][] {
    return this.memo('softmaxRows', () => {
      const { exps } = softmaxRowParts(this.forward.logits);
      return packSoftmaxRows(this.forward.logits, exps, this.forward.probs);
    });
  }

  get gradientRows(): number[][] {
    return this.memo('gradientRows', () =>
      packGradientRows(this.forward.probs, this.grads.dLogits, this.target));
  }

  private get deltaW(): Matrix { return this.memo('deltaW', () => subtractMatrix(this.r.after.W, this.r.before.W)); }
  private get deltaB(): number[] { return this.memo('deltaB', () => subtractVec(this.r.after.b, this.r.before.b)); }
  private get deltaE(): Matrix { return this.memo('deltaE', () => subtractMatrix(this.r.after.E, this.r.before.E)); }

  // ── Panel props (typed against the components, so the wiring is checked) ──

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
      matrix: this.shownModel.E, highlightedRows: this.context,
      rowNote: (i: number) => contextSlotNote(this.context, i, this.d),
    }));
  }

  /** The concatenated context embeddings x — the whole "hidden layer" now. */
  get xPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('xPanel', () => ({
      symbol: 'x', phase: '[E[c₁];E[c₂];E[c₃]]', step: this.step, dimmed: this.dimmed,
      values: this.forward.x, rowHeadings: w1RowLabels(this.vocab, this.context, this.d),
      compact: true,
    }));
  }

  get wPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('wPanel', () => ({
      symbol: 'W', phase: weightsPhase('D×V', this.step), step: this.step, dimmed: this.dimmed,
      randomInit: stillRandomInit(this.step), matrix: this.shownModel.W,
      rowHeadings: w1RowLabels(this.vocab, this.context, this.d),
      columnHeaders: [...this.vocab], rowHeadingMinWidth: '8ch',
    }));
  }

  get bPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('bPanel', () => ({
      symbol: 'b', phase: 'V — output bias', step: this.step, dimmed: this.dimmed,
      values: this.shownModel.b, rowHeadings: [...this.vocab], compact: true,
    }));
  }

  get softmaxPanel(): ComponentProps<typeof RowSoftmax> {
    return this.memo('softmaxPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed,
      matrix: this.softmaxRows,
      logitLabel: 'ℓ = x·W+b', logitSymbol: '\\ell',
      contextTokens: this.context,
    }));
  }

  get gradientPanel(): ComponentProps<typeof GradientColumn> {
    return this.memo('gradientPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed,
      matrix: this.gradientRows, logitSymbol: '\\ell',
      contextTokens: this.context,
    }));
  }

  // ∇W = x ⊗ (p−y) — the ONLY weight gradient left without the hidden layer.
  get dWWorkingPanel(): ComponentProps<typeof WeightUpdateWorking> {
    return this.memo('dWWorkingPanel', () => ({
      title: '\\nabla W = x \\otimes (p-y)',
      rowFactor: this.forward.x, rowLabels: w1RowLabels(this.vocab, this.context, this.d),
      colFactor: this.gradientRows.map((r) => r[2]), colLabels: [...this.vocab],
      deltas: this.deltaW, lr: this.lr, step: this.step, dimmed: this.dimmed,
      rowHeadingMinWidth: '8ch',
    }));
  }

  // ∇b = p − y (the output gradient itself).
  get dbWorkingPanel(): ComponentProps<typeof BiasUpdateWorking> {
    return this.memo('dbWorkingPanel', () => ({
      title: '\\Delta b = -\\eta\\,\\nabla b',
      rowLabels: [...this.vocab],
      decomposition: [
        { label: 'p', values: this.gradientRows.map((r) => r[0]), muted: true },
        { label: 'y', values: this.gradientRows.map((r) => r[1]), muted: true },
        { label: 'p − y = ∇b', values: this.gradientRows.map((r) => r[2]) },
      ],
      deltas: this.deltaB, before: this.shownModel.b, after: this.r.after.b,
      lr: this.lr, step: this.step, dimmed: this.dimmed,
    }));
  }

  get dEPanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('dEPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed,
      symbol: `\\nabla ${paramTex('E', 'E')}`, phase: 'context rows',
      matrix: this.grads.dE, highlightedRows: this.context,
    }));
  }

  get eAfterPanel(): ComponentProps<typeof EmbeddingMatrix> {
    return this.memo('eAfterPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed,
      symbol: paramTex('E', 'E'), phase: 'after step',
      matrix: this.r.after.E, deltas: this.deltaE, highlightedRows: this.context,
    }));
  }

  get wAfterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('wAfterPanel', () => ({
      symbol: 'W', phase: 'after step', step: this.step, dimmed: this.dimmed,
      matrix: this.r.after.W, deltas: this.deltaW,
      rowHeadings: w1RowLabels(this.vocab, this.context, this.d),
      columnHeaders: [...this.vocab], rowHeadingMinWidth: '8ch',
    }));
  }

  get bAfterPanel(): ComponentProps<typeof VectorPanel> {
    return this.memo('bAfterPanel', () => ({
      symbol: 'b', phase: 'after step', step: this.step, dimmed: this.dimmed,
      values: this.r.after.b, deltas: this.deltaB, rowHeadings: [...this.vocab], compact: true,
    }));
  }

  // ── Stage-shell readouts ──

  get meanLoss(): number {
    return this.memo('meanLoss', () => lblStrategy.loss(this.r.after, this.statics.blocks));
  }

  /** Blocks the post-step model still gets wrong (argmax ≠ target). */
  get misclassified(): number {
    return this.memo('misclassified', () =>
      misclassifiedCount(this.statics.blocks, (b) => forwardPass(this.r.after, b.context).probs));
  }

  /** The JS-console scope for this step's worked example. */
  get scope(): Record<string, unknown> {
    return this.memo('scope', () => ({
      E: this.r.after.E, W: this.r.after.W, b: this.r.after.b,
      Ebefore: this.r.before.E, Wbefore: this.r.before.W,
    }));
  }
}
