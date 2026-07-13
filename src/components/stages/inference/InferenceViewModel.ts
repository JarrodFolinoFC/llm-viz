import { softmaxRowParts, argmax } from 'mlblocks/core';
import { StepViewModel, packSoftmaxRows } from 'mlblocks';

import { decodeChain, withTemperature, type Decoding } from './decoding';

/** Cap on generation so a cycle (common at toy scale) stays readable. */
const MAX_GEN = 14;

/**
 * The read-only inference derivation every stage shares, as one pure object:
 * the temperature→softmax→argmax readout and the generation chain, all lazy
 * cached getters (see {@link StepViewModel}). Built once per (model, context,
 * decoding) by {@link useInference}; interaction state (the context selector,
 * the decoding knobs) stays in the hook — a change constructs a new instance.
 */
export class InferenceViewModel<M> extends StepViewModel {
  constructor(
    private readonly vocab: readonly string[],
    private readonly model: M,
    private readonly logitsFor: (model: M, context: number[]) => number[],
    /** The N-token context (a single token for the bigram/vector stages, N=1). */
    readonly context: number[],
    readonly decoding: Decoding,
  ) {
    super();
  }

  /** The current (last-context) token — what the panels highlight. */
  get current(): number {
    return this.context[this.context.length - 1];
  }

  /** Temperature-scaled logits for the current context. */
  private get scaled(): number[] {
    return this.memo('scaled', () =>
      withTemperature(this.logitsFor(this.model, this.context), this.decoding.temperature));
  }

  private get parts() {
    return this.memo('parts', () => softmaxRowParts(this.scaled));
  }

  /** Temperature-scaled next-token distribution. */
  get probs(): number[] {
    return this.parts.probs;
  }

  /** The greedy next-token pick. */
  get predicted(): number {
    return this.memo('predicted', () => argmax(this.probs));
  }

  /** `[logit, eˣ, prob]` per next-token slot — for the shared Softmax panel. */
  get softmaxRows(): number[][] {
    return this.memo('softmaxRows', () => packSoftmaxRows(this.scaled, this.parts.exps, this.probs));
  }

  /** The generated continuation (greedy or sampled). */
  get seq(): number[] {
    return this.memo('seq', () =>
      decodeChain(
        this.context,
        (soFar) => this.logitsFor(this.model, soFar.slice(-this.context.length)),
        this.decoding,
        { maxTokens: MAX_GEN, stopToken: this.vocab.indexOf('.') },
      ));
  }
}
