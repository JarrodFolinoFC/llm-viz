import type { ReactNode } from 'react';

import { cssVar } from '../lib/cssVars';
import { flashStyles } from '../lib/flashStyles';
import { Grid } from './Grid';
import { VectorCell } from './VectorCell';
import { NumericCell } from './NumericCell';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';
import { JsRowButton } from './JsRowButton';
import { normLiteralSnippet } from '../lib/snippets';
import { useP } from '../primitives/context';

interface EmbeddingMatrixProps {
  vocab: readonly string[];
  /** V × d matrix; each row is one token's learned vector. */
  matrix: number[][];
  /** Math symbol for the title, e.g. "E" or "U". */
  symbol: string;
  /** Muted suffix after the symbol, e.g. "before step". */
  phase: string;
  /** Which training phase this matrix belongs to — Weights, Backprop (∇E), or Update.
   *  Injected from the `panel(stage, …)` node in a flow; pass directly when standalone. */
  stage?: TrainingStage;
  step: number;
  /** Greys the panel out (e.g. before the first step, when values are placeholders). */
  dimmed?: boolean;
  /** The values shown are still the untouched random init (purple badge dot). */
  randomInit?: boolean;
  /** Token row to flash-highlight (the active prev or target token). */
  highlightedRow?: number | null;
  /** Several token rows to highlight at once (e.g. the MLP's N context tokens). */
  highlightedRows?: number[];
  /**
   * Optional V × d per-component deltas. When present each component shows its
   * change (the "E ← E − η·∇E" update view) stacked above the value, matching
   * MatrixPanel / VectorPanel's `deltas` — used by the post-step "E (after step)"
   * panel.
   */
  deltas?: number[][] | null;
  /** Optional muted annotation appended to a token's row heading — e.g. the
   *  forward-pass slot a context token feeds ("→ x[1] · pos1"). Return null for
   *  rows that need no note. */
  rowNote?: (i: number) => ReactNode;
}

/**
 * A V × d embedding/unembedding matrix: one VectorCell per token row. Same shell
 * as the scalar WeightMatrix, but each cell holds the token's d-vector instead
 * of a single weight.
 */
export function EmbeddingMatrix({ vocab, matrix, symbol, phase, stage, step, dimmed = false, randomInit, highlightedRow, highlightedRows, deltas, rowNote }: EmbeddingMatrixProps) {
  const P = useP();
  const { aHead } = flashStyles(highlightedRow != null ? { row: highlightedRow, target: -1 } : null);
  const marked = new Set(highlightedRows);
  const markStyle = (i: number) =>
    marked.has(i) ? { background: cssVar.chipPrevBg, fontWeight: 600 as const } : undefined;
  // Highlighted context-row headings get warm amber text to match the amber fill
  // (same prev/amber convention as the training-corpus chips).
  const markHeadingStyle = (i: number) =>
    marked.has(i) ? { ...markStyle(i), color: cssVar.chipPrevFg } : undefined;

  return (
    <Panel
      title={<SymbolTitle symbol={symbol} phase={phase} parens />}
      stage={stage}
      step={step}
      dimmed={dimmed}
      randomInit={randomInit}
    >
      <Grid
        columnHeaders={[`vector (d=${matrix[0]?.length ?? 0})`]}
        rowHeadings={vocab.map((w, i) => {
          const note = rowNote?.(i);
          return note ? (
            <P.View inline align="baseline" gap={6}>
              <P.Text>{w}</P.Text>
              <P.Text sty={{ em: 0.8, color: 'textSecondary', nowrap: true }}>{note}</P.Text>
            </P.View>
          ) : (
            w
          );
        })}
        cells={matrix.map((row, i) => [
          <VectorCell
            values={row}
            signed
            annotations={
              deltas ? deltas[i].map((d) => <NumericCell value={d} signed prefix="Δ" />) : undefined
            }
          />,
        ])}
        columnHeaderStyle={() => ({ textAlign: 'center', color: cssVar.textPrimary })}
        rowHeadingStyle={(i) => ({ textAlign: 'right', ...markHeadingStyle(i), ...aHead(i) })}
        cellStyle={(i) => markStyle(i)}
        highlightedRow={highlightedRow ?? undefined}
        rowAction={(i) => <JsRowButton snippet={normLiteralSnippet(matrix[i])} label={`‖${vocab[i]}‖`} />}
      />
    </Panel>
  );
}
