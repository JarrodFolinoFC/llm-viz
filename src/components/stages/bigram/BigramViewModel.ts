import type { ComponentProps } from 'react';

import { softmaxRow, analysis, maxAbs } from 'mlblocks/core';
import type { Matrix, Pair } from 'mlblocks/core';
import type { ModelPoint } from 'mlblocks';
import { StepViewModel, packSoftmaxRows, packGradientRows } from 'mlblocks';
import type { TrainingCorpus, PreviousSoftmax, RowSoftmax } from 'mlblocks';

import { bigramStrategy, type BigramStepResult } from '../../../training/strategies/bigram';
import type { WeightMatrix } from './WeightMatrix';
import type { WeightHistoryMatrix } from './WeightHistoryMatrix';
import type { GradientUpdate } from './GradientUpdate';
import type { FlashMatrixTable } from './FlashMatrixTable';

/** The run's step-independent inputs (memoised by the container). */
export interface BigramRunStatics {
  vocab: readonly string[];
  corpus: string;
  /** The corpus's training pairs — the trainer's examples. */
  pairs: Pair[];
  /** Empirical next-token distribution per row (for the dist-error metric). */
  empirical: Matrix;
}

/**
 * Every piece of the bigram flow's derived UI state, as one pure object: the
 * flow spec's panel bindings, the overview chart's inputs and the stage
 * shell's readouts are all getters here. Built once per training step from
 * the trainer's output; see {@link StepViewModel} for the caching contract
 * (lazy, compute-once, immutable per step).
 */
export class BigramViewModel extends StepViewModel {
  constructor(
    private readonly statics: BigramRunStatics,
    private readonly r: BigramStepResult,
    private readonly lr: number,
    private readonly history: ModelPoint<Matrix>[],
    /** The run's decimal precision (a trainer constructor arg — same value). */
    private readonly precision: number,
  ) {
    super();
  }

  // ── The run/step scalars the chart, shell and spec read directly ──
  get vocab(): readonly string[] { return this.statics.vocab; }
  get corpus(): string { return this.statics.corpus; }
  get step(): number { return this.r.step; }
  get currentPair(): Pair { return this.r.currentPair; }
  get examplesLength(): number { return this.statics.pairs.length; }
  /** Step 0 is the untrained init — panels render hints, not live values. */
  get dimmed(): boolean { return this.r.step === 0; }

  // ── Shared intermediates ──

  /** W as it stood *before* this step's update (the flashed row restored). */
  get prevW(): Matrix {
    return this.memo('prevW', () => {
      const { W, flash } = this.r;
      return flash ? W.map((row, i) => (i === flash.prev ? flash.prevRow ?? row : row)) : W;
    });
  }

  get prevSoftmax(): Matrix {
    return this.memo('prevSoftmax', () => this.prevW.map(softmaxRow));
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

  /** `[grad, −η·grad]` per next-token slot — the step SGD prescribes. */
  get updateRows(): number[][] {
    return this.memo('updateRows', () => this.r.prevGrad.map((g) => [g, -this.lr * g]));
  }

  /** Per-column change applied to the trained row this step (W − prevRow). */
  get flashDeltas(): number[] | null {
    return this.memo('flashDeltas', () => {
      const { W, flash } = this.r;
      return flash?.prevRow ? W[flash.prev].map((v, j) => v - flash.prevRow[j]) : null;
    });
  }

  // ── Panel props (typed against the components, so the wiring is checked) ──

  get corpusPanel(): ComponentProps<typeof TrainingCorpus> {
    return this.memo('corpusPanel', () => ({
      // pos (corpus position), not pairIdx — the two differ when shuffled.
      step: this.step, corpus: this.corpus, pairIdx: this.r.flash?.pos ?? null,
    }));
  }

  get wPanel(): ComponentProps<typeof WeightMatrix> {
    return this.memo('wPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, matrix: this.prevW,
      domainMax: maxAbs(this.prevW),
    }));
  }

  get historyPanel(): ComponentProps<typeof WeightHistoryMatrix> {
    return this.memo('historyPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, history: this.history,
      domainMax: this.historyMaxAbs,
    }));
  }

  /** max |w| across the WHOLE history — the sparklines' shared |y| domain
   *  (an O(steps·V²) scan, so it lives here, not in the panel's render). */
  private get historyMaxAbs(): number {
    return this.memo('historyMaxAbs', () => {
      let max = 1e-6;
      for (const p of this.history) {
        for (const row of p.model) for (const v of row) max = Math.max(max, Math.abs(v));
      }
      return max;
    });
  }

  get prevSoftmaxPanel(): ComponentProps<typeof PreviousSoftmax> {
    return this.memo('prevSoftmaxPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, matrix: this.prevSoftmax,
    }));
  }

  get rowSoftmaxPanel(): ComponentProps<typeof RowSoftmax> {
    return this.memo('rowSoftmaxPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, dimmed: this.dimmed,
      matrix: this.softmaxRows,
    }));
  }

  get gradientUpdatePanel(): ComponentProps<typeof GradientUpdate> {
    return this.memo('gradientUpdatePanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, dimmed: this.dimmed,
      matrix: this.gradientRows, updates: this.updateRows.map(([, u]) => u),
    }));
  }

  get newWPanel(): ComponentProps<typeof FlashMatrixTable> {
    return this.memo('newWPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, matrix: this.r.W,
      domainMax: maxAbs(this.r.W),
      flashDeltas: this.flashDeltas,
    }));
  }

  // ── Stage-shell readouts ──

  get meanLoss(): number {
    return this.memo('meanLoss', () => bigramStrategy.loss(this.r.W, this.statics.pairs));
  }

  /** Mean total-variation distance to the empirical distribution, formatted. */
  get distError(): string {
    return this.memo('distError', () =>
      analysis(this.r.W, this.statics.empirical).totalError.toFixed(this.precision));
  }

  /** The JS-console scope for this step's worked example. */
  get scope(): Record<string, unknown> {
    return this.memo('scope', () => ({
      W: this.r.W, Wbefore: this.prevW,
      a: this.currentPair.prev, b: this.currentPair.target,
    }));
  }
}
