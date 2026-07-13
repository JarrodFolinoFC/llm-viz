import { TrainingStage } from 'mlblocks';
import { getActivePrecision } from 'mlblocks/core';
import type { MlpFlowView } from './MlpFlowContainer';

/**
 * One plain-English note: a concept title, its stage (which panel it rides next
 * to, and its accent tint), and a `text` builder that reads the *live* training
 * view — so the note describes the very numbers on the panel beside it (the
 * current context, the model's current guess, this step's nudges, …).
 */
export interface ConceptNoteSpec {
  title: string;
  text: (view: MlpFlowView) => string;
  stage: TrainingStage;
}

// ── Small selectors over the live view, so the copy stays readable ──
const fixed = (n: number) => n.toFixed(getActivePrecision());
const pct = (p: number) => `${Math.round(p * 100)}%`;
const word = (v: MlpFlowView, id: number) => v.vocab[id] ?? `#${id}`;
const contextStr = (v: MlpFlowView) => v.context.map((id) => word(v, id)).join(' ');
/** p(next = i) for the displayed example — softmaxRows are [logit, eˣ, prob]. */
const probOf = (v: MlpFlowView, i: number) => v.softmaxRows[i]?.[2] ?? 0;
/** Vocab ranked by current probability, most-likely first. */
const rankByProb = (v: MlpFlowView) =>
  v.vocab.map((w, i) => ({ w, p: probOf(v, i) })).sort((a, b) => b.p - a.p);
/** Index of the largest-magnitude element (the "loudest" entry to point at). */
const peakVec = (values: number[]) =>
  values.reduce((best, x, i) => (Math.abs(x) > Math.abs(values[best] ?? 0) ? i : best), 0);
/** Row/col + value of the largest-magnitude entry of a matrix. */
const peakMatrix = (m: number[][]) => {
  let r = 0;
  let c = 0;
  m.forEach((row, i) => row.forEach((x, j) => {
    if (Math.abs(x) > Math.abs(m[r]?.[c] ?? 0)) {
      r = i;
      c = j;
    }
  }));
  return { r, c, v: m[r]?.[c] ?? 0 };
};
const near0 = (n: number) => Math.abs(n) < 1e-9;

/**
 * Live plain-English translations of every panel in the MLP-scalar pipeline,
 * in the friendly, analogy-first voice of Adam Geitgey's "Natural Language
 * Processing is Fun". Each note rides beside the panel it explains and reads the
 * current training state, so it narrates the exact numbers on that panel.
 *
 * A running set of analogies keeps the story coherent: word "secret numbers"
 * (embeddings), "dials" (weights), "gut-feelings" (hidden units), "nudges"
 * (gradients / the update).
 */
export const MLP_CONCEPT_NOTES = {
  // ── Data ──
  corpus: {
    title: 'Training data',
    text: (v) => `Right now: given “${contextStr(v)}”, the real next word is “${word(v, v.target)}”. Each block is one such flashcard.`,
    stage: TrainingStage.Data,
  },

  // ── Weights (pre-update) ──
  embeddings: {
    title: 'E — embeddings',
    text: (v) => {
      const items = v.context.map((id) => `${word(v, id)} ${fixed(v.E[id]?.[0] ?? 0)}`).join(', ');
      return `This context’s secret numbers: ${items}. The model invents and tunes them — lookalike words drift together.`;
    },
    stage: TrainingStage.Parameters,
  },
  w1: {
    title: 'W₁ — first weights',
    text: (v) =>
      v.step <= 1
        ? `Layer 1 of 2 — “find features”: random starting dials (step ${v.step}) that mix the word-numbers into gut-feelings.`
        : `Layer 1 of 2 — “find features”: dials mixing word-numbers into gut-feelings. Largest right now: ${fixed(peakMatrix(v.W1).v)}.`,
    stage: TrainingStage.Parameters,
  },
  b1: {
    title: 'b₁ — hidden bias',
    text: (v) => {
      const i = peakVec(v.b1);
      return near0(v.b1[i] ?? 0)
        ? `All zero at init — no gut-feeling leans yet. A per-unit head-start before any words are seen.`
        : `A standing nudge per gut-feeling. Biggest right now: h${i} at ${fixed(v.b1[i])}.`;
    },
    stage: TrainingStage.Parameters,
  },
  w2: {
    title: 'W₂ — second weights',
    text: (v) => {
      if (v.step <= 1) return `Layer 2 of 2 — “use features”: random dials (step ${v.step}) scoring each next word from the gut-feelings. Two layers with a squash between is what lets it learn curved patterns, not just straight lines.`;
      const { r, c, v: mv } = peakMatrix(v.W2);
      return `Layer 2 of 2 — “use features”: dials scoring each word from the gut-feelings. Strongest: h${r}→“${word(v, c)}” (${fixed(mv)}).`;
    },
    stage: TrainingStage.Parameters,
  },
  b2: {
    title: 'b₂ — output bias',
    text: (v) => {
      const i = peakVec(v.b2);
      return near0(v.b2[i] ?? 0)
        ? `All zero at init. This is each word’s head-start — how common it is before context.`
        : `Each word’s head-start before context. Highest now: “${word(v, i)}” (${fixed(v.b2[i])}).`;
    },
    stage: TrainingStage.Parameters,
  },

  // ── Forward pass ──
  preActivation: {
    title: 'Weighted sum → squash',
    text: (v) => {
      const i = peakVec(v.z1);
      const lo = Math.min(...v.hidden);
      const hi = Math.max(...v.hidden);
      return `Each word-number × its dials, summed (+ bias), then tanh squashes each into −1…1. Strongest raw signal: unit h${i} at ${fixed(v.z1[i] ?? 0)}; the gut-feelings now span ${fixed(lo)}…${fixed(hi)} — the model’s compressed read on the context.`;
    },
    stage: TrainingStage.Forward,
  },
  softmax: {
    title: 'Softmax',
    text: (v) => {
      const [a, b] = rankByProb(v);
      return `Most sure it’s “${a.w}” (${pct(a.p)}), then “${b.w}” (${pct(b.p)}) — one honest percentage per word it knows.`;
    },
    stage: TrainingStage.Forward,
  },

  // ── Loss ──
  loss: {
    title: 'Loss',
    text: (v) => {
      const p = probOf(v, v.target);
      const l = -Math.log(Math.max(p, 1e-12));
      return `It gives the true next word “${word(v, v.target)}” a ${pct(p)} chance → loss ${fixed(l)}. Lower means less surprised; training pushes it down.`;
    },
    stage: TrainingStage.Loss,
  },

  // ── Backprop ──
  gradient: {
    title: 'How wrong were we?',
    text: (v) => {
      const top = rankByProb(v)[0];
      const tgt = word(v, v.target);
      return top.w === tgt
        ? `It already favours the right word “${tgt}” (${pct(probOf(v, v.target))}); the remaining gaps are small.`
        : `It leaned toward “${top.w}” but the answer is “${tgt}”. The fix: push “${tgt}” up and the rest down.`;
    },
    stage: TrainingStage.Backprop,
  },
  dW2: {
    title: '∇W₂ — blame for W₂',
    text: (v) => {
      const { r, c, v: mv } = peakMatrix(v.dW2);
      return `Which way to turn each scoring dial. Biggest push: h${r}→“${word(v, c)}” (${fixed(mv)}).`;
    },
    stage: TrainingStage.Backprop,
  },
  dz1: {
    title: '∇z₁ — blame at the gut-feelings',
    text: (v) => {
      const i = peakVec(v.dz1);
      return `The mistake traced back to each gut-feeling. Most blame: h${i} (${fixed(v.dz1[i] ?? 0)}).`;
    },
    stage: TrainingStage.Backprop,
  },
  dW1: {
    title: '∇W₁ — blame for W₁',
    text: (v) => `How the word-mixing dials pushed us wrong. Largest correction: ${fixed(peakMatrix(v.dW1).v)}.`,
    stage: TrainingStage.Backprop,
  },
  dE: {
    title: '∇E — blame for embeddings',
    text: (v) => {
      // Only the context rows get a gradient; report the biggest of them.
      const rows = v.context.length ? v.context : v.dE.map((_, i) => i);
      const bi = rows.reduce((best, id) => (Math.abs(v.dE[id]?.[0] ?? 0) > Math.abs(v.dE[best]?.[0] ?? 0) ? id : best), rows[0] ?? 0);
      return `The nudge each context word’s number should get. Biggest: “${word(v, bi)}” (${fixed(v.dE[bi]?.[0] ?? 0)}).`;
    },
    stage: TrainingStage.Backprop,
  },

  // ── Update (post-step) ──
  eAfter: {
    title: 'E — nudged',
    text: (v) => {
      const bi = peakVec(v.deltaE.map((r) => r[0] ?? 0));
      return `New embeddings after the step. Biggest move: “${word(v, bi)}” by Δ${fixed(v.deltaE[bi]?.[0] ?? 0)}.`;
    },
    stage: TrainingStage.Update,
  },
  w1After: {
    title: 'W₁ — nudged',
    text: (v) => `Word-mixing dials after the step; nudged by up to Δ${fixed(peakMatrix(v.deltaW1).v)}.`,
    stage: TrainingStage.Update,
  },
  b1After: {
    title: 'b₁ — nudged',
    text: (v) => `Hidden baselines after the step; biggest change Δ${fixed(v.deltaB1[peakVec(v.deltaB1)] ?? 0)}.`,
    stage: TrainingStage.Update,
  },
  w2After: {
    title: 'W₂ — nudged',
    text: (v) => `Scoring dials after the step; nudged by up to Δ${fixed(peakMatrix(v.deltaW2).v)}.`,
    stage: TrainingStage.Update,
  },
  b2After: {
    title: 'b₂ — nudged',
    text: (v) => `Per-word head-starts after the step; biggest change Δ${fixed(v.deltaB2[peakVec(v.deltaB2)] ?? 0)}.`,
    stage: TrainingStage.Update,
  },
} as const satisfies Record<string, ConceptNoteSpec>;
