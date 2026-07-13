// Local-time countdown helpers shared by the date-centric apps (birthdays,
// days-until, and their `home` panels). Everything works in *local* midnights —
// "days until" means calendar days as the user experiences them, not 24-hour
// blocks — which is why nothing here touches UTC.

export const MS_PER_DAY = 86_400_000;

/** Local midnight of the current day. */
export function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Parse a `YYYY-MM-DD` string as a local-midnight Date. */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Whole days from today to `date`. Positive is in the future, 0 is today,
 * negative is in the past. `Math.round` absorbs the ±1h wobble of a DST
 * boundary between the two midnights.
 */
export function daysUntil(date: Date, from = startOfToday()): number {
  return Math.round((date.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Human label for a day count: "Today", "Tomorrow", "in 3 days", "2 days ago". */
export function countdownLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}
