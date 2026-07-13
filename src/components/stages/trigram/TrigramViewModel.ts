import type { ComponentProps } from 'react';

import { subtractMatrix, softmaxRow } from 'mlblocks/core';
import type { Block } from 'mlblocks/core';
import { StepViewModel, packSoftmaxRows, packGradientRows, misclassifiedCount } from 'mlblocks';
import type { TrainingCorpus, MatrixPanel, RowSoftmax, GradientColumn } from 'mlblocks';

import { trigramStrategy, type Tensor3, type TrigramFlash, type TrigramStepResult } from '../../../training/strategies/trigram';

/** The run's step-independent inputs (memoised by the container). */
export interface TrigramRunStatics {
  vocab: readonly string[];
  corpus: string;
  /** The corpus's 2-token training blocks — the trainer's examples. */
  blocks: Block[];
}

/**
 * Every piece of the trigram flow's derived UI state, as one pure object. The
 * V×V×V tensor is visualised as V slice tables — `W[c]` for each first-context
 * token c — so `slicePanels[c]` is one panel's props and the active slice
 * (the one this step trained) carries the highlighted row.
 * See {@link StepViewModel} for the caching contract.
 */
export class TrigramViewModel extends StepViewModel {
  constructor(
    private readonly statics: TrigramRunStatics,
    private readonly r: TrigramStepResult,
  ) {
    super();
  }

  // ── The run/step scalars ──
  get vocab(): readonly string[] { return this.statics.vocab; }
  get corpus(): string { return this.statics.corpus; }
  get examplesLength(): number { return this.statics.blocks.length; }
  get step(): number { return this.r.step; }
  get flash(): TrigramFlash | null { return this.r.flash; }
  /** Step 0 is the untrained init — panels render hints, not live values. */
  get dimmed(): boolean { return this.r.step === 0; }

  private get block(): Block { return this.statics.blocks[this.r.pairIdx] ?? this.statics.blocks[0]; }
  /** The displayed example's two context token ids [c, a] (oldest first). */
  get context(): number[] {
    return this.memo('context', () =>
      this.r.flash ? [this.r.flash.c, this.r.flash.prev] : this.block.context);
  }
  /** The first context token — which W slice the displayed example reads. */
  private get activeC(): number { return this.context[0]; }
  /** The second (most recent) context token — which row of that slice. */
  private get activeA(): number { return this.context[1]; }

  // ── Shared intermediates ──

  /** W as it stood *before* this step's update (the flashed row restored). */
  get prevW(): Tensor3 {
    return this.memo('prevW', () => {
      const { W, flash } = this.r;
      if (!flash) return W;
      return W.map((slice, c) =>
        c === flash.c ? slice.map((row, a) => (a === flash.prev ? flash.prevRow : row)) : slice);
    });
  }

  /** `[logit, eˣ, prob]` per next-token slot — the worked softmax's rows. */
  get softmaxRows(): number[][] {
    return this.memo('softmaxRows', () =>
      packSoftmaxRows(this.r.prevLogits, this.r.prevExps, this.r.prevProbs));
  }

  /** `[p, y, p − y]` per next-token slot. */
  get gradientRows(): number[][] {
    return this.memo('gradientRows', () =>
      packGradientRows(this.r.prevProbs, this.r.prevGrad, this.r.currentPair.target));
  }

  // ── Panel props (typed against the components, so the wiring is checked) ──

  get corpusPanel(): ComponentProps<typeof TrainingCorpus> {
    return this.memo('corpusPanel', () => ({
      step: this.step, corpus: this.corpus,
      pairIdx: this.r.flash?.pos ?? null, contextLen: 2,
    }));
  }

  /** One V×V slice table per first-context token: `slicePanels[c]` shows
   *  `W[c]` before this step, with the trained row highlighted on the active
   *  slice — together they render the whole V×V×V tensor. The active slice's
   *  index renders as the amber context chip (`W ⟨dog⟩`), matching the corpus
   *  and "given ⟨…⟩" chips for the same token. */
  get slicePanels(): ComponentProps<typeof MatrixPanel>[] {
    return this.memo('slicePanels', () =>
      this.vocab.map((word, c) => {
        const active = c === this.activeC && !this.dimmed;
        return {
          symbol: active ? 'W' : `W[\\text{${word}}]`,
          tokenChip: active ? word : undefined,
          phase: active ? 'before step — active slice' : 'before step',
          step: this.step, dimmed: this.dimmed, randomInit: this.step <= 1,
          matrix: this.prevW[c],
          rowHeadings: [...this.vocab], columnHeaders: [...this.vocab],
          highlightedRows: active ? [this.activeA] : [],
        };
      }));
  }

  get softmaxPanel(): ComponentProps<typeof RowSoftmax> {
    return this.memo('softmaxPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed,
      matrix: this.softmaxRows,
      logitLabel: 'x = W[c][a]ᵢ',
      // The full 2-token conditioning context: candidate-only rows + the
      // "given ⟨c⟩ ⟨a⟩" caption, so the softmax reads as p(next | c, a).
      contextTokens: this.context,
    }));
  }

  get gradientPanel(): ComponentProps<typeof GradientColumn> {
    return this.memo('gradientPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.flash, dimmed: this.dimmed,
      matrix: this.gradientRows,
      contextTokens: this.context,
    }));
  }

  /** The trained slice after the step, with the −η·∇ deltas stacked on the
   *  updated row — the only slice SGD touched this step. */
  get afterPanel(): ComponentProps<typeof MatrixPanel> {
    return this.memo('afterPanel', () => ({
      symbol: 'W',
      tokenChip: this.vocab[this.activeC],
      phase: 'after step — trained slice',
      step: this.step, dimmed: this.dimmed,
      matrix: this.r.W[this.activeC],
      deltas: subtractMatrix(this.r.W[this.activeC], this.prevW[this.activeC]),
      rowHeadings: [...this.vocab], columnHeaders: [...this.vocab],
      highlightedRows: this.dimmed ? [] : [this.activeA],
    }));
  }

  // ── Stage-shell readouts ──

  get meanLoss(): number {
    return this.memo('meanLoss', () => trigramStrategy.loss(this.r.W, this.statics.blocks));
  }

  /** Blocks the post-step model still gets wrong (argmax ≠ target). */
  get misclassified(): number {
    return this.memo('misclassified', () =>
      misclassifiedCount(this.statics.blocks, (b) => softmaxRow(this.r.W[b.context[0]][b.context[1]])));
  }

  /** The JS-console scope for this step's worked example. */
  get scope(): Record<string, unknown> {
    return this.memo('scope', () => ({
      W: this.r.W, Wbefore: this.prevW,
      c: this.activeC, a: this.activeA, b: this.r.currentPair.target,
    }));
  }
}
