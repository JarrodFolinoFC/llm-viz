/**
 * A collision-safe id for client-generated records: `crypto.randomUUID` where
 * available, with a timestamp+random fallback for older/locked-down contexts.
 * One definition for every app — birthdays, days-until, watch-tracker and the
 * reminders store all grow their ids here.
 */
export const newId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id${Date.now()}-${Math.random().toString(36).slice(2)}`;
