import type { NativeHintView } from 'vimium-layer';

import styles from './HintText.module.css';

export interface HintTextProps {
  /** The label text to render. */
  text: string;
  /** Live hint state from `useVimHint` (null when not in hint mode). */
  hint: NativeHintView | null;
}

/**
 * Render `text` with its own leading letters doubling as the vim hint — e.g. the
 * "World" tab hints as `wo`, shown as a lit **Wo**rld. In hint mode the first
 * `label.length` characters of the text are highlighted as the keys to press (the
 * already-typed portion dimmed); at rest it's just the plain text.
 *
 * Pairs with `useVimHint({ label })` where `label` is the lower-cased leading
 * letters of the same text (so the highlighted characters *are* the label). For
 * multi-word/short labels the highlight covers the first `label.length` glyphs.
 */
export function HintText({ text, hint }: HintTextProps) {
  const active = !!hint && hint.matched;
  if (!active) return <>{text}</>;

  const label = hint!.label;
  // How many leading glyphs of the text the label actually spells (case-insensitive).
  // Normally the whole label (e.g. "lon" ⊆ "London"); if the layer had to append a
  // disambiguating digit ("lo2"), only the real letters match — the extra chars are
  // shown after them, so what's lit always equals what you type.
  let match = 0;
  while (match < label.length && match < text.length && text[match].toLowerCase() === label[match]) match++;
  const key = text.slice(0, match) + label.slice(match); // real letters + any suffix
  const rest = text.slice(match);
  const typed = hint!.typed.length;
  return (
    <>
      <span className={styles.key}>
        <span className={styles.typed}>{key.slice(0, typed)}</span>
        {key.slice(typed)}
      </span>
      {rest}
    </>
  );
}
