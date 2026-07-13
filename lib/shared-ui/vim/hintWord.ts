/**
 * The alphanumeric letters of a label, lower-cased — the word the vim layer
 * derives a `prefix` hint from (its shortest distinguishing leading letters, via
 * `useVimHint({ prefix })`). Empty when the text has none (e.g. an icon-only
 * control), in which case the caller should fall back to a plain auto label.
 */
export function hintWord(text: string): string {
  return text.replace(/[^a-z0-9]/gi, '').toLowerCase();
}
