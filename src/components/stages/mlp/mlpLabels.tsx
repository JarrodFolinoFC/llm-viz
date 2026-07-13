import { StackedCell } from 'mlblocks';

/**
 * Structured labels for the d-component slots concatenated into x. Each x
 * component is a lookup into the embedding table E, named by its E index — e.g.
 * the slot `{ token: 'the', comp: 0 }` is the 0th component of "the"'s embedding
 * row, i.e. `E[the][0]`. Keeping token and component separate lets the row
 * heading render the token as a coloured chip; use {@link slotLabel} for the
 * flat `E[the][0]` string form.
 */
export interface ContextSlot {
  /** The context token this slot's embedding component belongs to. */
  token: string;
  /** Which embedding component (0…d−1) of that token. */
  comp: number;
}

export const contextSlots = (vocab: readonly string[], context: number[], d: number): ContextSlot[] =>
  context.flatMap((c) => Array.from({ length: d }, (_, comp) => ({ token: vocab[c], comp })));

/** The flat `E[token][comp]` string form of a slot (modal headings, footers). */
export const slotLabel = ({ token, comp }: ContextSlot) => `E[${token}][${comp}]`;

/** Labels for the H hidden units (W₁'s columns, W₂'s rows). */
export const hiddenLabels = (h: number) => Array.from({ length: h }, (_, j) => `h${j}`);

/**
 * Phase tag for the pre-update weight panels. The worked example replays the
 * step on the weights BEFORE its update (the "after step" row shows the new
 * ones), so at step 1 these panels still show the random init — mark that,
 * mirroring the bigram stage's `before · random init` convention.
 */
export const weightsPhase = (dims: string, step: number) => {
  if (step === 0) return `${dims} — random init, untrained`;
  return step === 1 ? `${dims} — before step · random init` : `${dims} — before step`;
};

/** These panels show the pre-update weights, so through step 1 the values are
 *  still the untouched random init — flagged on the badge as a purple dot. */
export const stillRandomInit = (step: number) => step <= 1;

/**
 * Row labels for W₁: its rows are *positional* input slots (context position ×
 * embedding dim), shared across all tokens — not per-token weights. We show the
 * position as the label and the token currently filling that slot as a muted
 * hint, so the matrix reads as "a fixed transform on the concatenated context".
 */
export const w1RowLabels = (vocab: readonly string[], context: number[], d: number) =>
  context.flatMap((c, i) =>
    Array.from({ length: d }, (_, j) => (
      <StackedCell annotations={[vocab[c]]} main={`pos${i}·d${j}`} />
    )),
  );

/** Plain-string positional slot labels (e.g. "pos1·d1") — W₁'s row index names. */
export const posSlotLabels = (context: number[], d: number) =>
  context.flatMap((_, i) => Array.from({ length: d }, (_, j) => `pos${i}·d${j}`));
