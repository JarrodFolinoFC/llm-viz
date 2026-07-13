import { getActivePrecision } from './activePrecision';

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return n.toFixed(getActivePrecision());
}

/** Render a value the way the math console prints it — numbers at the active
 *  precision, arrays recursively. Pure string formatting (platform-free). */
export function formatValue(v: unknown): string {
  if (typeof v === 'number') return fmtNum(v);
  if (typeof v === 'boolean' || v === null || v === undefined) return String(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return `[${v.map(formatValue).join(', ')}]`;
  return String(v);
}
