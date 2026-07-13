import type { ComponentProps } from 'react';

import { analysis } from 'mlblocks/core';
import type { Matrix, Pair } from 'mlblocks/core';
import type { ModelPoint } from 'mlblocks';
import { StepViewModel, packSoftmaxRows, packGradientRows } from 'mlblocks';
import type { TrainingCorpus, GradientColumn } from 'mlblocks';

import {
  EmbeddingStrategy, embeddingStrategy,
  type EmbeddingModel, type EmbeddingStepResult,
} from '../../../training/strategies/embedding';
import type { DotProduct } from './DotProduct';
import type { EmbeddingPair } from './EmbeddingPair';
import type { EmbeddingScatter } from './EmbeddingScatter';
import type { EmbeddingUpdate } from './EmbeddingUpdate';

/** The run's step-independent inputs (memoised by the container). */
export interface VectorRunStatics {
  vocab: readonly string[];
  corpus: string;
  /** The corpus's training pairs — the trainer's examples. */
  pairs: Pair[];
  /** Empirical next-token distribution per row (for the dist-error metric). */
  empirical: Matrix;
}

/**
 * Every piece of the vector (embedding) flow's derived UI state, as one pure
 * object — the flow spec's panel bindings and the stage shell's readouts are
 * all getters here. Built once per training step from the trainer's output;
 * see {@link StepViewModel} for the caching contract.
 */
export class VectorViewModel extends StepViewModel {
  constructor(
    private readonly statics: VectorRunStatics,
    private readonly r: EmbeddingStepResult,
    private readonly lr: number,
    private readonly history: ModelPoint<EmbeddingModel>[],
    /** Weight tying (U = E) — part of the run's identity (flipping re-inits). */
    private readonly tied: boolean,
    /** The run's decimal precision (a trainer constructor arg — same value). */
    private readonly precision: number,
  ) {
    super();
  }

  // ── The run/step scalars ──
  get vocab(): readonly string[] { return this.statics.vocab; }
  get corpus(): string { return this.statics.corpus; }
  get step(): number { return this.r.step; }
  get examplesLength(): number { return this.statics.pairs.length; }
  get currentPair(): Pair { return this.r.currentPair; }
  /** Step 0 is the untrained init — panels render hints, not live values. */
  get dimmed(): boolean { return this.r.step === 0; }
  /** The panels' shared sub-heading while a worked step is on show. */
  private get beforePhase(): string | undefined {
    return this.dimmed ? undefined : '(before update)';
  }

  // ── Shared intermediates ──

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
      // pos (corpus position), not pairIdx — the two differ when shuffled.
      step: this.step, corpus: this.corpus, pairIdx: this.r.flash?.pos ?? null,
    }));
  }

  get pairBeforePanel(): ComponentProps<typeof EmbeddingPair> {
    return this.memo('pairBeforePanel', () => ({
      vocab: this.vocab, step: this.step,
      E: this.r.EBefore, U: this.r.UBefore,
      prevRow: this.r.flash ? this.r.flash.prev : null,
      targetRow: this.r.flash ? this.r.flash.target : null,
      phase: this.step <= 1 ? '(random)' : '(before update)',
    }));
  }

  get scatterPanel(): ComponentProps<typeof EmbeddingScatter> {
    return this.memo('scatterPanel', () => ({
      vocab: this.vocab, step: this.step, E: this.r.E, EBefore: this.r.EBefore,
      U: this.r.U, UBefore: this.r.UBefore, flash: this.r.flash,
      history: this.history,
    }));
  }

  get dotProductPanel(): ComponentProps<typeof DotProduct> {
    return this.memo('dotProductPanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed, flash: this.r.flash,
      currentPair: this.currentPair, EBefore: this.r.EBefore, UBefore: this.r.UBefore,
      softmaxRows: this.softmaxRows, showSum: true,
      phase: this.beforePhase,
    }));
  }

  get gradientPanel(): ComponentProps<typeof GradientColumn> {
    return this.memo('gradientPanel', () => ({
      vocab: this.vocab, step: this.step, flash: this.r.flash, dimmed: this.dimmed,
      matrix: this.gradientRows,
      phase: this.beforePhase,
    }));
  }

  get updatePanel(): ComponentProps<typeof EmbeddingUpdate> {
    return this.memo('updatePanel', () => ({
      vocab: this.vocab, step: this.step, dimmed: this.dimmed, lr: this.lr, flash: this.r.flash,
      U: this.r.UBefore, tied: this.tied,
      phase: this.beforePhase,
    }));
  }

  get pairAfterPanel(): ComponentProps<typeof EmbeddingPair> {
    return this.memo('pairAfterPanel', () => ({
      vocab: this.vocab, step: this.step,
      E: this.r.E, U: this.r.U,
      EBefore: this.r.flash ? this.r.EBefore : undefined,
      UBefore: this.r.flash ? this.r.UBefore : undefined,
      prevRow: this.r.flash ? this.r.flash.prev : null,
      targetRow: this.r.flash ? this.r.flash.target : null,
      phase: this.step === 0 ? '(random)' : '(after update)',
    }));
  }

  // ── Stage-shell readouts ──

  get meanLoss(): number {
    return this.memo('meanLoss', () =>
      embeddingStrategy.loss({ E: this.r.E, U: this.r.U }, this.statics.pairs));
  }

  /** Mean total-variation distance to the empirical distribution, formatted. */
  get distError(): string {
    return this.memo('distError', () =>
      analysis(EmbeddingStrategy.logits(this.r.E, this.r.U), this.statics.empirical)
        .totalError.toFixed(this.precision));
  }

  /** The JS-console scope for this step's worked example. */
  get scope(): Record<string, unknown> {
    return this.memo('scope', () => ({
      E: this.r.E, U: this.r.U, EBefore: this.r.EBefore, UBefore: this.r.UBefore,
      a: this.currentPair.prev, b: this.currentPair.target,
    }));
  }
}
