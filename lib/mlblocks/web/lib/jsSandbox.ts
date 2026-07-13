// A sandboxed JavaScript evaluator for the in-app math console.
//
// Unlike a raw eval(), every identifier the code references is resolved against
// a curated `sandbox` object via a `with` + Proxy whose `has` trap claims to own
// *every* name — so no lookup ever falls through to the real global scope
// (`window`, `fetch`, `document`, …all resolve to a ReferenceError). A short
// keyword blocklist closes the syntactic escape hatches (`import(...)`,
// `constructor`/`__proto__` prototype-walking, `Function`/`eval`).
//
// This is real JavaScript — `.map`, `.reduce`, arrow functions and `console.log`
// all work — running against an injected scope (the live model's E, U, …, plus
// the math helpers), which is exactly the "as functional as possible, but only
// maths" tradeoff we want. It is not a security boundary against a determined
// attacker (perfect in-page JS sandboxing needs an iframe/Worker); it's a guard
// that keeps a local educational console from casually touching the host page.

import { dot } from '../../core/math/funcs';

export type Json = number | Json[];

/** A whitelisted helper: its runtime function plus the source shown in the cheatsheet. */
export interface Helper {
  fn: (...args: never[]) => unknown;
  /** JS source displayed (syntax-highlighted) when a snippet uses this helper. */
  src: string;
  /** One-line summary for the compact cheatsheet. */
  summary: string;
}

// Runtime `dot` shared with the panels (funcs.ts) so the console and the cells
// can never disagree on the same e·u. The `src` string below shows the simple
// teaching form (equal-length vectors) the user sees in the cheatsheet.
const sum = (v: number[]) => v.reduce((s, x) => s + x, 0);
const norm = (v: number[]) => Math.sqrt(dot(v, v));
const mean = (v: number[]) => sum(v) / v.length;
const softmax = (v: number[]) => {
  const m = Math.max(...v);
  const ex = v.map((x) => Math.exp(x - m));
  const Z = sum(ex);
  return ex.map((x) => x / Z);
};

export const HELPERS: Record<string, Helper> = {
  dot: {
    fn: dot as Helper['fn'],
    summary: 'dot(a, b) — dot product of two vectors',
    src: 'const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);',
  },
  sum: {
    fn: sum as Helper['fn'],
    summary: 'sum(v) — sum of a vector',
    src: 'const sum = v => v.reduce((s, x) => s + x, 0);',
  },
  mean: {
    fn: mean as Helper['fn'],
    summary: 'mean(v) — average of a vector',
    src: 'const mean = v => sum(v) / v.length;',
  },
  norm: {
    fn: norm as Helper['fn'],
    summary: 'norm(v) — Euclidean length √(v·v)',
    src: 'const norm = v => Math.sqrt(dot(v, v));',
  },
  softmax: {
    fn: softmax as Helper['fn'],
    summary: 'softmax(v) — turns logits into probabilities',
    src: [
      'const softmax = v => {',
      '  const m = Math.max(...v);            // for numerical stability',
      '  const ex = v.map(x => Math.exp(x - m));',
      '  const Z = ex.reduce((s, x) => s + x, 0);',
      '  return ex.map(x => x / Z);',
      '};',
    ].join('\n'),
  },
};

export const CONSTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

/** Syntactic escapes the `with`-proxy can't intercept (property walks, dynamic import). */
const BLOCKED = /\b(import|eval|Function|constructor|prototype|__proto__|globalThis|require)\b/;

/**
 * Evaluate one console line. `scope` holds read-only model vars (E, U, a, …);
 * `vars` holds user assignments + `ans` and is mutated in place so values
 * persist across lines. `onLog` receives `console.log(...)` output.
 */
export function runJs(
  code: string,
  scope: Record<string, unknown>,
  vars: Record<string, unknown>,
  onLog: (...args: unknown[]) => void,
): unknown {
  if (BLOCKED.test(code)) {
    throw new Error('disallowed keyword — the console only runs maths, no JS internals');
  }

  const base: Record<string, unknown> = {
    Math,
    Infinity,
    NaN,
    console: { log: onLog },
    ...Object.fromEntries(Object.entries(HELPERS).map(([k, h]) => [k, h.fn])),
    ...CONSTS,
    ...scope,
    ...vars,
  };

  const sandbox = new Proxy(base, {
    // Claim every name so no identifier escapes to the real global scope.
    has: () => true,
    get: (t, key) => {
      if (key === Symbol.unscopables) return undefined;
      if (typeof key === 'string' && Object.prototype.hasOwnProperty.call(t, key)) return t[key];
      throw new ReferenceError(`'${String(key)}' is not available in the math console`);
    },
    set: (t, key, val) => {
      if (typeof key === 'string') {
        vars[key] = val; // persist user assignments
        t[key] = val;
      }
      return true;
    },
  });

  // Try as a single expression first (so a bare `dot(...)` yields its value);
  // fall back to a statement block (assignments, console.log lines, an explicit
  // `return` from a "show process" snippet).
  let runner: (s: unknown) => unknown;
  try {
    runner = new Function('__sandbox', `with (__sandbox) { return ( ${code}\n ); }`) as typeof runner;
  } catch {
    runner = new Function('__sandbox', `with (__sandbox) { ${code}\n }`) as typeof runner;
  }
  return runner(sandbox);
}

// ── display formatting ───────────────────────────────────────────────────────

// Match the panels' numeric readouts: same decimal places as the live setting,
// so a console result reads identically to the cell it reproduces.
export { formatValue } from '../../core/format';

/** A short shape label for the cheatsheet (number / vector(n) / matrix(r×c)). */
export function shapeOf(v: unknown): string {
  if (typeof v === 'number') return 'number';
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'number')) return `vector(${v.length})`;
    if (Array.isArray(v[0])) return `matrix(${v.length}×${(v[0] as unknown[]).length})`;
    return 'array';
  }
  return typeof v;
}

export const HELPER_NAMES = Object.keys(HELPERS);
export const CONST_NAMES = Object.keys(CONSTS);
