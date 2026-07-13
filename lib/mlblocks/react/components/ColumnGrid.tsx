import type { ReactNode } from 'react';
import { Grid } from './Grid';
import { NumericCell } from './NumericCell';
import { Term } from './Term';
import { TokenChip } from './TokenChip';
import { useP } from '../primitives/context';

export interface CellDef {
  value: number;
  decimals?: number;
  signed?: boolean;
  prefix?: string;
  colorFn?: (value: number, isHighlighted: boolean) => string;
}

export interface ColumnDef {
  label: ReactNode;
  cells: CellDef[];
}

/**
 * Header for the exponentials column of the softmax tables. What
 * softmaxRowParts displays is e^(x − max), not the raw eˣ — the row max is
 * subtracted before exponentiating (the standard numerically-stable softmax),
 * so the label says so and the hover explains why p is unaffected.
 */
export function ExpShiftedHeader({ symbol = 'x' }: { symbol?: string } = {}) {
  // Default 'x' keeps the compact unicode label the bigram/vector stages use; a
  // non-default logit symbol (the MLP's ℓ) renders the header as KaTeX so it
  // matches the panel's other formulas rather than colliding with the input x.
  const isDefault = symbol === 'x';
  return (
    <Term
      label="eˣ⁻ᵐᵃˣ"
      labelLatex={isDefault ? undefined : `e^{\\,${symbol}_i - \\max_j ${symbol}_j}`}
      explain="Not the raw eˣ: the logits are shifted by the row's max before exponentiating — the standard numerically-stable softmax, which keeps these values finite however large the logits grow. The shift cancels in the ÷ Σ, so p is exactly the plain softmax."
      formula={`e^{\\,${symbol}_i - \\max_j ${symbol}_j}`}
    />
  );
}

/**
 * Shared "prev-token → next-token" row headings for the bigram table panels: a
 * chip for the previous token `a`, then the next token (a chip when it's the
 * target). Previously copy-pasted verbatim into RowSoftmax / GradientColumn /
 * GradientUpdate.
 */
export function pairRowLabels(
  vocab: readonly string[],
  prev: number | undefined,
  target: number | undefined,
): ReactNode[] {
  const prevToken = prev != null ? vocab[prev] : '';
  return vocab.map((v, i) => (
    <PairRowLabel key={i} prevToken={prevToken} word={v} isTarget={i === target} />
  ));
}

/**
 * Candidate-only row headings — just the next-token word (a chip when it's the
 * target), with no single "prev" chip. Used by stages that condition on a whole
 * context rather than one previous token (the MLP), where a per-row prev chip
 * would wrongly imply a bigram lookup; the conditioning context is named once in
 * the panel title instead.
 */
export function candidateRowLabels(
  vocab: readonly string[],
  target: number | undefined,
): ReactNode[] {
  return vocab.map((v, i) => (
    <CandidateRowLabel key={i} word={v} isTarget={i === target} />
  ));
}

function PairRowLabel({ prevToken, word, isTarget }: {
  prevToken: string; word: string; isTarget: boolean;
}) {
  const P = useP();
  return (
    <P.View inline align="baseline" gap={4}>
      <TokenChip text={prevToken} isPrev />
      {isTarget ? <TokenChip text={word} /> : <P.Text>{word}</P.Text>}
    </P.View>
  );
}

function CandidateRowLabel({ word, isTarget }: { word: string; isTarget: boolean }) {
  const P = useP();
  return isTarget ? <TokenChip text={word} /> : <P.Text>{word}</P.Text>;
}

interface ColumnGridProps {
  columns: ColumnDef[];
  rowLabels: ReactNode[];
  highlightedRow?: number;
  /** Optional summary row beneath the body (e.g. the softmax Σ totals). */
  rollup?: { label: ReactNode; cells: ReactNode[] };
  /** Optional trailing action per row (e.g. a "JS" console button). */
  rowAction?: (i: number) => ReactNode;
  /** When set, rows are clickable and report their candidate index — e.g. to
   *  open that candidate's worked softmax calculation. */
  onRowClick?: (i: number) => void;
}

/**
 * Renders column-oriented {@link ColumnDef}s as a Grid of NumericCells — the
 * shared body of the softmax / gradient / update table panels. (Replaces the
 * never-rendered `core/TabularData` ghost and its 3× inlined render loop.)
 */
export function ColumnGrid({ columns, rowLabels, highlightedRow, rollup, rowAction, onRowClick }: ColumnGridProps) {
  return (
    <Grid
      columnHeaders={columns.map((c) => c.label)}
      rowHeadings={rowLabels}
      cells={rowLabels.map((_, i) =>
        columns.map((col, j) => (
          <NumericCell key={j} {...col.cells[i]} isHighlighted={i === highlightedRow} />
        )),
      )}
      highlightedRow={highlightedRow}
      onRowClick={onRowClick}
      rollup={rollup}
      rowAction={rowAction}
    />
  );
}
