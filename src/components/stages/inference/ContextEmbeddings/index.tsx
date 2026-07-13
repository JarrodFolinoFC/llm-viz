import { Panel } from 'shared-ui';

import { color } from '../../../../theme';
import { Grid, VectorCell } from 'mlblocks';
import { TokenChip } from 'mlblocks';
import textStyles from '../../../core/panelText.module.css';

interface ContextEmbeddingsProps {
  vocab: readonly string[];
  /** The N context token ids (oldest → newest). */
  context: number[];
  /** V×d token embedding matrix. */
  E: number[][];
  /** The concatenated context embeddings, length N·d — the MLP's input vector. */
  x: number[];
}

/**
 * The MLP's input: each of the N context tokens is looked up in E, and the rows
 * are concatenated into one vector x (length N·d) that feeds the hidden layer.
 */
export function ContextEmbeddings({ vocab, context, E, x }: ContextEmbeddingsProps) {
  return (
    <Panel title="Context → embeddings">
      <Grid
        columnHeaders={['token', 'embedding E[c]']}
        rowHeadings={context.map((_, i) => `pos ${i}`)}
        cells={context.map((c) => [
          <TokenChip text={vocab[c]} isPrev />,
          <VectorCell values={E[c]} signed />,
        ])}
        columnHeaderStyle={() => ({ textAlign: 'center', color: color.text.secondary })}
        rowHeadingStyle={() => ({ textAlign: 'right' })}
      />
      <div className={textStyles.hint}>
        x = concat(embeddings) = <VectorCell values={x} signed /> (length {x.length})
      </div>
    </Panel>
  );
}
