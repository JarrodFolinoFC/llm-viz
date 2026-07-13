// Display formatters the apps kept re-implementing. Money is AUD because every
// app on the site reports in AUD; add a currency parameter if that ever changes.

/** AUD currency, e.g. `$1,234.56`. Pass `fractionDigits: 0` for whole dollars. */
export function aud(n: number, fractionDigits?: number): string {
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    ...(fractionDigits !== undefined && {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }),
  });
}

/** Compact AUD for axis labels and tight layouts, e.g. `$1.2M`. */
export function audCompact(n: number): string {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', notation: 'compact' });
}

const BYTE_UNITS = ['kB', 'MB', 'GB', 'TB'] as const;

/** Human byte size: `512 B`, `1.5 kB`, `12 MB`. One decimal below 10, none above. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < BYTE_UNITS.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${BYTE_UNITS[i]}`;
}
