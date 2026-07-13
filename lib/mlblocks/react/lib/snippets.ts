// Per-row JavaScript snippets for the "JS" action buttons. Each panel row maps
// to a {@link Snippet}: a `plain` one-line expression and a `verbose` version
// that console.logs each intermediate step (used when "show process" is on).
// `uses` names the helpers whose definitions the console should surface.

import { formatValue } from '../../core/format';
import { getActivePrecision } from '../../core/activePrecision';

export interface Snippet {
  plain: string;
  verbose: string;
  /** Helper names whose source the console should display for this snippet. */
  uses: string[];
  /** The same calculation as the PyTorch one-liner you'd write in nanoGPT —
   *  shown (not run) alongside the JS so the mapping to real code is explicit. */
  pytorch?: string;
}

// Embed literals at the same precision the panels display, so a snippet's inputs
// read like the cells it came from.
const num = (x: number) => Number(x.toFixed(getActivePrecision()));
const vec = (v: number[]) => `[${v.map(num).join(', ')}]`;

/** Dot product of two model vectors, e.g. EmbeddingPair's e·u row. */
export function dotRowSnippet(matA: string, matB: string, i: number): Snippet {
  return {
    plain: `dot(${matA}[${i}], ${matB}[${i}])`,
    verbose: [
      `const e = ${matA}[${i}], u = ${matB}[${i}];`,
      `console.log('e =', e);`,
      `console.log('u =', u);`,
      `const terms = e.map((x, k) => x * u[k]);`,
      `console.log('e[k] * u[k] =', terms);`,
      `const s = terms.reduce((acc, t) => acc + t, 0);`,
      `console.log('e · u =', s);`,
      `return s;`,
    ].join('\n'),
    uses: ['dot'],
    pytorch: `torch.dot(${matA}[${i}], ${matB}[${i}])`,
  };
}

/** One dimension's contribution to a dot product (DotProduct panel rows). */
export function productRowSnippet(matA: string, idxA: string, matB: string, idxB: string, k: number): Snippet {
  return {
    plain: `${matA}[${idxA}][${k}] * ${matB}[${idxB}][${k}]`,
    verbose: [
      `const e = ${matA}[${idxA}][${k}], u = ${matB}[${idxB}][${k}];`,
      `console.log('e[${k}] =', e);`,
      `console.log('u[${k}] =', u);`,
      `console.log('product =', e * u);`,
      `return e * u;`,
    ].join('\n'),
    uses: [],
    pytorch: `${matA}[${idxA}, ${k}] * ${matB}[${idxB}, ${k}]`,
  };
}

/** softmax of a logit row, returning the probability at index `i`. Self-contained
 *  (uses the row's literal logits) so it works regardless of the source matrix. */
export function softmaxRowSnippet(logits: number[], i: number): Snippet {
  return {
    plain: `softmax(${vec(logits)})[${i}]`,
    verbose: [
      `const x = ${vec(logits)};`,
      `const m = Math.max(...x);`,
      `console.log('max =', m);`,
      `const ex = x.map(v => Math.exp(v - m));`,
      `console.log('exp(x - max) =', ex);`,
      `const Z = ex.reduce((s, v) => s + v, 0);`,
      `console.log('Z (sum) =', Z);`,
      `const p = ex.map(v => v / Z);`,
      `console.log('p =', p);`,
      `return p[${i}];`,
    ].join('\n'),
    uses: ['softmax'],
    pytorch: `F.softmax(logits, dim=-1)[${i}]  # autograd re-derives the eˣ/Σ you see here`,
  };
}

/** p − y for one next-token row (GradientColumn). */
export function gradientRowSnippet(p: number, y: number): Snippet {
  return {
    plain: `${num(p)} - ${y}`,
    verbose: [
      `const p = ${num(p)};      // predicted probability`,
      `const y = ${y};      // 1 if this is the target token, else 0`,
      `console.log('p =', p);`,
      `console.log('y =', y);`,
      `console.log('p - y =', p - y);`,
      `return p - y;`,
    ].join('\n'),
    uses: [],
    pytorch: 'loss = F.cross_entropy(logits, target); loss.backward()  # autograd fills dlogits with exactly p − y',
  };
}

/** softmax over a matrix row (the next-token distribution for token `i`). */
export function rowSoftmaxSnippet(mat: string, i: number): Snippet {
  return {
    plain: `softmax(${mat}[${i}])`,
    verbose: [
      `const x = ${mat}[${i}];           // logits for what follows token ${i}`,
      `console.log('logits =', x);`,
      `const p = softmax(x);`,
      `console.log('probabilities =', p);`,
      `return p;`,
    ].join('\n'),
    uses: ['softmax'],
    pytorch: `F.softmax(${mat}[${i}], dim=-1)`,
  };
}

/** Euclidean norm of a matrix row (embedding length). */
export function normRowSnippet(mat: string, i: number): Snippet {
  return {
    plain: `norm(${mat}[${i}])`,
    verbose: [
      `const v = ${mat}[${i}];`,
      `console.log('v =', v);`,
      `const sq = v.map(x => x * x);`,
      `console.log('squared =', sq);`,
      `const s = sq.reduce((acc, x) => acc + x, 0);`,
      `console.log('sum of squares =', s);`,
      `console.log('norm =', Math.sqrt(s));`,
      `return Math.sqrt(s);`,
    ].join('\n'),
    uses: ['norm'],
    pytorch: `torch.linalg.norm(${mat}[${i}])`,
  };
}

/** Euclidean norm of a literal row (self-contained — works for any matrix). */
export function normLiteralSnippet(values: number[]): Snippet {
  return {
    plain: `norm(${vec(values)})`,
    verbose: [
      `const v = ${vec(values)};`,
      `console.log('v =', v);`,
      `const s = v.reduce((acc, x) => acc + x * x, 0);`,
      `console.log('sum of squares =', s);`,
      `console.log('norm =', Math.sqrt(s));`,
      `return Math.sqrt(s);`,
    ].join('\n'),
    uses: ['norm'],
    pytorch: 'torch.linalg.norm(v)',
  };
}

/** Sum of a literal row (e.g. verifying a probability row sums to 1). */
export function sumRowSnippet(values: number[]): Snippet {
  return {
    plain: `sum(${vec(values)})`,
    verbose: [
      `const v = ${vec(values)};`,
      `console.log('v =', v);`,
      `const s = v.reduce((acc, x) => acc + x, 0);`,
      `console.log('sum =', s);`,
      `return s;`,
    ].join('\n'),
    uses: ['sum'],
    pytorch: 'v.sum()  # a softmax row must sum to 1',
  };
}

/** Pick the plain or verbose source for a snippet. */
export function snippetSource(s: Snippet, showProcess: boolean): string {
  return showProcess ? s.verbose : s.plain;
}

/** Re-export for callers that format inline literals. */
export { formatValue };
