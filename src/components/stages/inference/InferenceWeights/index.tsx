import { Panel } from 'shared-ui';

import { signedColormap } from 'mlblocks/core';
import { maxAbs } from 'mlblocks/core';
import { flashStyles } from 'mlblocks';
import { color, useViewSettings } from '../../../../theme';
import { FormulaDisplay } from 'mlblocks';
import { Grid } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';

interface InferenceWeightsProps {
  vocab: readonly string[];
  matrix: number[][];
  /** Token whose row is being read (highlighted). */
  current: number;
  /** Predicted next token (highlighted column). */
  predicted: number;
}

/**
 * The pretrained logit table W, as a signed heatmap. Inference reads — never
 * writes — these weights: the current token's row and the predicted next token's
 * column are highlighted to show the single row that feeds the softmax.
 */
export function InferenceWeights({ vocab, matrix, current, predicted }: InferenceWeightsProps) {
  const { precision } = useViewSettings();
  const cellBackground = signedColormap(maxAbs(matrix));
  const { aHead, bHead } = flashStyles({ row: current, target: predicted });

  const title = (
    <span className={titleStyles.title}>
      <FormulaDisplay inline latex="W" />
      <span>— pretrained logit table</span>
    </span>
  );

  return (
    <Panel title={title}>
      <Grid
        columnHeaders={[...vocab]}
        rowHeadings={[...vocab]}
        cells={matrix.map((row) => row.map((v) => v.toFixed(precision)))}
        cellStyle={(i, j) => ({ background: cellBackground(matrix[i][j], i, j) })}
        columnHeaderStyle={(j) => ({ textAlign: 'center', color: color.text.primary, ...bHead(j) })}
        rowHeadingStyle={(i) => ({ textAlign: 'right', ...aHead(i) })}
      />
    </Panel>
  );
}
