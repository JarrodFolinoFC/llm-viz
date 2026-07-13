// Decoding for the inference pages: temperature-scaled softmax plus the
// greedy/sample choice — the toy version of nanoGPT sample.py's `temperature`
// (its `top_k` would be the next knob to add).
import { mulberry32, softmaxRow, argmax } from 'mlblocks/core';

export type DecodeMode = 'greedy' | 'sample';

export interface Decoding {
  /** Softmax temperature: p ∝ e^(x/T). 1 = the trained distribution. */
  temperature: number;
  mode: DecodeMode;
  /** Bumped by the "resample" button so sampled chains re-roll (seeded, so a
   *  given nonce always draws the same chain — renders stay pure). */
  nonce: number;
}

export const DEFAULT_DECODING: Decoding = { temperature: 1, mode: 'greedy', nonce: 0 };

/** Scale logits by 1/T — the whole temperature mechanism is this one line. */
export const withTemperature = (logits: number[], temperature: number) =>
  logits.map((x) => x / Math.max(temperature, 1e-6));

/** Draw an index from a probability vector given one uniform sample u ∈ [0,1). */
export function sampleIndex(probs: number[], u: number): number {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (u < acc) return i;
  }
  return probs.length - 1;
}

/**
 * Unroll a generation chain from `start`: each step scores the sequence so far
 * (the caller's `logitsOf` slices whatever context its model needs), applies
 * the temperature, then either takes the argmax (greedy) or samples.
 */
export function decodeChain(
  start: number[],
  logitsOf: (soFar: number[]) => number[],
  { temperature, mode, nonce }: Decoding,
  { maxTokens, stopToken }: { maxTokens: number; stopToken: number },
): number[] {
  const rand = mulberry32(nonce + 1);
  const out = [...start];
  for (let i = 0; i < maxTokens; i++) {
    const probs = softmaxRow(withTemperature(logitsOf(out), temperature));
    const next = mode === 'greedy' ? argmax(probs) : sampleIndex(probs, rand());
    out.push(next);
    if (next === stopToken) break;
  }
  return out;
}
