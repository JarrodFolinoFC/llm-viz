import { describe, expect, it, vi } from 'vitest';

import { runJs, formatValue, shapeOf } from 'mlblocks';
import { dotRowSnippet, softmaxRowSnippet, snippetSource } from 'mlblocks';

const noop = () => {};
const run = (code: string, scope: Record<string, unknown> = {}, vars: Record<string, unknown> = {}) =>
  runJs(code, scope, vars, noop);

describe('jsSandbox — evaluation', () => {
  it('evaluates arithmetic with precedence', () => {
    expect(run('2 + 3 * 4')).toBe(14);
    expect(run('(2 + 3) * 4')).toBe(20);
  });
  it('supports real JS: arrow functions, .map and .reduce', () => {
    expect(run('[1, 2, 3].map(x => x * 2)')).toEqual([2, 4, 6]);
    expect(run('[1, 2, 3].reduce((s, x) => s + x, 0)')).toBe(6);
  });
  it('exposes the math helpers', () => {
    expect(run('dot([0.25, -0.99], [0.47, -0.35])')).toBeCloseTo(0.464, 6);
    expect(run('norm([3, 4])')).toBe(5);
    const p = run('softmax([2, 1, 0])') as number[];
    expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
  });
  it('reads the injected model scope', () => {
    expect(run('dot(E[a], U[b])', { E: [[1, 2]], U: [[3, 4]], a: 0, b: 0 })).toBe(11);
  });
  it('persists user variables + ans across calls', () => {
    const vars: Record<string, unknown> = {};
    run('x = [1, 2]', {}, vars);
    expect(run('dot(x, x)', {}, vars)).toBe(5);
  });
  it('captures console.log via the onLog hook', () => {
    const log = vi.fn();
    runJs("console.log('z =', 3 + 4); return 1;", {}, {}, log);
    expect(log).toHaveBeenCalledWith('z =', 7);
  });
});

describe('jsSandbox — safety', () => {
  it('blocks access to host globals', () => {
    expect(() => run('window')).toThrow();
    expect(() => run('fetch')).toThrow();
    expect(() => run('document')).toThrow();
  });
  it('blocks prototype-walk and dynamic-eval escapes by keyword', () => {
    expect(() => run('[].constructor')).toThrow(/disallowed/);
    expect(() => run("eval('1')")).toThrow(/disallowed/);
    expect(() => run("import('x')")).toThrow(/disallowed/);
    expect(() => run('({}).__proto__')).toThrow(/disallowed/);
  });
});

describe('formatValue / shapeOf', () => {
  it('formats numbers and arrays at the panels\' precision (2 dp)', () => {
    expect(formatValue(0.46399999)).toBe('0.46');
    expect(formatValue([1, 2.5])).toBe('[1.00, 2.50]');
  });
  it('describes shapes', () => {
    expect(shapeOf(3)).toBe('number');
    expect(shapeOf([1, 2])).toBe('vector(2)');
    expect(shapeOf([[1], [2]])).toBe('matrix(2×1)');
  });
});

describe('snippets', () => {
  it('plain and verbose forms produce the same result', () => {
    const scope = { E: [[0.25, -0.99]], U: [[0.47, -0.35]] };
    const s = dotRowSnippet('E', 'U', 0);
    expect(run(snippetSource(s, false), scope)).toBeCloseTo(0.464, 6);
    expect(run(snippetSource(s, true), scope)).toBeCloseTo(0.464, 6);
  });
  it('softmax snippet returns the indexed probability', () => {
    const s = softmaxRowSnippet([2, 1, 0], 0);
    const plain = run(snippetSource(s, false)) as number;
    const verbose = run(snippetSource(s, true)) as number;
    expect(plain).toBeCloseTo(verbose, 9);
    expect(plain).toBeGreaterThan(0.6);
  });
});
