import type { ReactNode } from 'react';
import { Panel } from 'shared-ui';

import { signedColormap } from 'mlblocks/core';
import { maxAbs } from 'mlblocks/core';
import { flashStyles } from 'mlblocks';
import { color, useViewSettings } from '../../../../theme';
import { Grid } from 'mlblocks';

interface EmbeddingTableProps {
  title: ReactNode;
  vocab: readonly string[];
  /** V×d matrix (token embeddings E, or unembeddings U). */
  matrix: number[][];
  /** Row to highlight (the current token), or null for none. */
  highlightRow?: number | null;
}

/**
 * A V×d embedding matrix as a signed heatmap — used for both the token
 * embeddings E and the unembeddings U on the vector-bigram inference page. The
 * current token's row is highlighted (it's the e_a that gets dotted against U).
 */
export function EmbeddingTable({ title, vocab, matrix, highlightRow = null }: EmbeddingTableProps) {
  const { precision } = useViewSettings();
  const cellBackground = signedColormap(maxAbs(matrix));
  const d = matrix[0]?.length ?? 0;
  const { aHead } = flashStyles(highlightRow != null ? { row: highlightRow, target: -1 } : null);

  return (
    <Panel title={title}>
      <Grid
        columnHeaders={Array.from({ length: d }, (_, j) => `d${j}`)}
        rowHeadings={[...vocab]}
        cells={matrix.map((row) => row.map((v) => v.toFixed(precision)))}
        cellStyle={(i, j) => ({ background: cellBackground(matrix[i][j], i, j) })}
        columnHeaderStyle={() => ({ textAlign: 'center', color: color.text.secondary })}
        rowHeadingStyle={(i) => ({ textAlign: 'right', ...aHead(i) })}
      />
    </Panel>
  );
}
