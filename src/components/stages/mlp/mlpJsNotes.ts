import { TrainingStage } from 'mlblocks';
import { getActivePrecision } from 'mlblocks/core';
import type { MlpFlowView } from './MlpFlowContainer';

/**
 * One pure-JavaScript note: a concept title, its stage (which panel it rides
 * next to, and its accent tint), and a `code` builder that reads the *live*
 * training view — so the snippet's dims and inline results are the very
 * numbers on the panel beside it.
 */
export interface JsNoteSpec {
  title: string;
  code: (view: MlpFlowView) => string;
  stage: TrainingStage;
}

// ── Small selectors over the live view, so the comments stay accurate ──
const fixed = (n: number) => n.toFixed(getActivePrecision());
const word = (v: MlpFlowView, id: number) => v.vocab[id] ?? `#${id}`;
/** The pipeline's dimensions: vocab, embedding, context length, hidden units. */
const dims = (v: MlpFlowView) => ({
  V: v.vocab.length,
  D: v.E[0]?.length ?? 0,
  N: v.context.length,
  H: v.b1.length,
});
/** p(next = i) for the displayed example — softmaxRows are [logit, eˣ, prob]. */
const probOf = (v: MlpFlowView, i: number) => v.softmaxRows[i]?.[2] ?? 0;

/**
 * The maths of every panel in the MLP-scalar pipeline, written as short,
 * dependency-free JavaScript — the code-flavoured sibling of
 * {@link MLP_CONCEPT_NOTES}. Each snippet computes its panel from the ones
 * before it (weights → forward → backprop → update), with the live example's
 * dimensions and numbers in the comments.
 */
export const MLP_JS_NOTES = {
  // ── Data ──
  corpus: {
    title: 'Training data',
    code: (v) => {
      const ctx = v.context.map((id) => `'${word(v, id)}'`).join(', ');
      return [
        `const words = corpus.split(' ');`,
        `const context = words.slice(i, i + ${dims(v).N});`,
        `const target = words[i + ${dims(v).N}];`,
        `// now: [${ctx}] → '${word(v, v.target)}'`,
      ].join('\n');
    },
    stage: TrainingStage.Data,
  },

  // ── Weights (pre-update) ──
  embeddings: {
    title: 'E — embeddings',
    code: (v) => {
      const { V, D, N } = dims(v);
      return [
        `// ${V}×${D}: ${D} learnable numbers per word`,
        `const E = Array.from({ length: ${V} },`,
        `  () => Array.from({ length: ${D} }, randn));`,
        `// look up + concat the context rows:`,
        `const x = context.flatMap((id) => E[id]); // len ${N * D}`,
      ].join('\n');
    },
    stage: TrainingStage.Parameters,
  },
  w1: {
    title: 'W₁ — first weights',
    code: (v) => {
      const { D, N, H } = dims(v);
      return [
        `// ${N * D}×${H}: one dial per (input slot, hidden unit)`,
        `const W1 = Array.from({ length: ${N * D} },`,
        `  () => Array.from({ length: ${H} }, randn));`,
      ].join('\n');
    },
    stage: TrainingStage.Parameters,
  },
  b1: {
    title: 'b₁ — hidden bias',
    code: (v) => [
      `// one head-start per hidden unit, zero at init`,
      `const b1 = new Array(${dims(v).H}).fill(0);`,
    ].join('\n'),
    stage: TrainingStage.Parameters,
  },
  w2: {
    title: 'W₂ — second weights',
    code: (v) => {
      const { H, V } = dims(v);
      return [
        `// ${H}×${V}: one dial per (hidden unit, vocab word)`,
        `const W2 = Array.from({ length: ${H} },`,
        `  () => Array.from({ length: ${V} }, randn));`,
      ].join('\n');
    },
    stage: TrainingStage.Parameters,
  },
  b2: {
    title: 'b₂ — output bias',
    code: (v) => [
      `// one head-start per vocab word, zero at init`,
      `const b2 = new Array(${dims(v).V}).fill(0);`,
    ].join('\n'),
    stage: TrainingStage.Parameters,
  },

  // ── Forward pass ──
  preActivation: {
    title: 'h = tanh(x·W₁ + b₁)',
    code: (v) => {
      const { H } = dims(v);
      return [
        `// each unit sums every input × its dial, + bias, then squashes`,
        `const z1 = Array.from({ length: ${H} }, (_, h) =>`,
        `  b1[h] + x.reduce((s, xi, d) => s + xi * W1[d][h], 0));`,
        `const h = z1.map(Math.tanh); // gut-feelings in −1…1`,
      ].join('\n');
    },
    stage: TrainingStage.Forward,
  },
  softmax: {
    title: 'softmax(h·W₂ + b₂)',
    code: (v) => [
      `const logits = b2.map((b, w) =>`,
      `  b + h.reduce((s, hj, j) => s + hj * W2[j][w], 0));`,
      `const ex = logits.map(Math.exp);`,
      `const Z = ex.reduce((s, e) => s + e, 0);`,
      `const p = ex.map((e) => e / Z); // sums to 1`,
      `// p[target] = p['${word(v, v.target)}'] = ${fixed(probOf(v, v.target))}`,
    ].join('\n'),
    stage: TrainingStage.Forward,
  },

  // ── Loss ──
  loss: {
    title: 'Loss',
    code: (v) => {
      const p = probOf(v, v.target);
      return [
        `const loss = -Math.log(p[target]);`,
        `// -Math.log(${fixed(p)}) = ${fixed(-Math.log(Math.max(p, 1e-12)))}`,
      ].join('\n');
    },
    stage: TrainingStage.Loss,
  },

  // ── Backprop ──
  gradient: {
    title: 'p − y',
    code: (v) => [
      `// y: 1 for the true next word, 0 elsewhere`,
      `const dLogits = p.map((pi, w) =>`,
      `  pi - (w === target ? 1 : 0));`,
      `// target '${word(v, v.target)}' gets ${fixed(probOf(v, v.target) - 1)}`,
    ].join('\n'),
    stage: TrainingStage.Backprop,
  },
  dW2: {
    title: '∇W₂ = h ⊗ (p − y)',
    code: (v) => {
      const { H, V } = dims(v);
      return [
        `// outer product → ${H}×${V}, one blame per dial`,
        `const dW2 = h.map((hj) =>`,
        `  dLogits.map((g) => hj * g));`,
      ].join('\n');
    },
    stage: TrainingStage.Backprop,
  },
  dz1: {
    title: '∇z₁',
    code: () => [
      `// pull the blame back through W2…`,
      `const dh = W2.map((row) =>`,
      `  row.reduce((s, w, k) => s + w * dLogits[k], 0));`,
      `// …and through tanh (its slope is 1 − h²)`,
      `const dz1 = dh.map((g, j) => g * (1 - h[j] ** 2));`,
    ].join('\n'),
    stage: TrainingStage.Backprop,
  },
  dW1: {
    title: '∇W₁ = x ⊗ ∇z₁',
    code: (v) => {
      const { D, N, H } = dims(v);
      return [
        `// outer product → ${N * D}×${H}`,
        `const dW1 = x.map((xi) =>`,
        `  dz1.map((g) => xi * g));`,
      ].join('\n');
    },
    stage: TrainingStage.Backprop,
  },
  dE: {
    title: '∇E — scatter',
    code: (v) => {
      const { D } = dims(v);
      return [
        `// blame for each input slot, via W1`,
        `const dx = x.map((_, d) =>`,
        `  dz1.reduce((s, g, h) => s + W1[d][h] * g, 0));`,
        `// scatter each slot onto its word's row of E`,
        `const dE = E.map((row) => row.map(() => 0));`,
        `context.forEach((id, n) => { dE[id] = dE[id]`,
        `  .map((val, j) => val + dx[n * ${D} + j]); });`,
      ].join('\n');
    },
    stage: TrainingStage.Backprop,
  },

  // ── Update (post-step) ──
  eAfter: {
    title: 'E ← E − η·∇E',
    code: (v) => [
      `E = E.map((row, i) => row.map(`,
      `  (val, j) => val - ${v.lr} * dE[i][j]));`,
    ].join('\n'),
    stage: TrainingStage.Update,
  },
  w1After: {
    title: 'W₁ ← W₁ − η·∇W₁',
    code: (v) => [
      `W1 = W1.map((row, d) => row.map(`,
      `  (w, h) => w - ${v.lr} * dW1[d][h]));`,
    ].join('\n'),
    stage: TrainingStage.Update,
  },
  b1After: {
    title: 'b₁ ← b₁ − η·∇z₁',
    code: (v) => [
      `// the bias's gradient is dz1 itself`,
      `b1 = b1.map((b, j) => b - ${v.lr} * dz1[j]);`,
    ].join('\n'),
    stage: TrainingStage.Update,
  },
  w2After: {
    title: 'W₂ ← W₂ − η·∇W₂',
    code: (v) => [
      `W2 = W2.map((row, j) => row.map(`,
      `  (w, k) => w - ${v.lr} * dW2[j][k]));`,
    ].join('\n'),
    stage: TrainingStage.Update,
  },
  b2After: {
    title: 'b₂ ← b₂ − η·(p − y)',
    code: (v) => [
      `// the bias's gradient is p − y itself`,
      `b2 = b2.map((b, w) => b - ${v.lr} * dLogits[w]);`,
    ].join('\n'),
    stage: TrainingStage.Update,
  },
} as const satisfies Record<string, JsNoteSpec>;
