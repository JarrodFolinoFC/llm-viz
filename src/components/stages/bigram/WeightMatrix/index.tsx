import { stepColormap, signedColormap } from 'mlblocks/core';
import { pairFlashStyles } from 'mlblocks';
import { color, useViewSettings } from '../../../../theme';
import { FormulaDisplay } from 'mlblocks';
import { Grid } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { PhaseTag } from 'mlblocks';
import { JsRowButton } from 'mlblocks';
import { rowSoftmaxSnippet } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';
import type { Pair } from 'mlblocks/core';

interface WeightMatrixProps {
  vocab: readonly string[];
  matrix: number[][];
  /** max |w| over the matrix — the heatmap domain (view-model computed). */
  domainMax: number;
  step: number;
  flash?: Pair | null;
}

export function WeightMatrix({ vocab, matrix, domainMax, step, flash }: WeightMatrixProps) {
  const { precision } = useViewSettings();
  // Step 0 is the untrained random init — keep it neutral grey. Once SGD starts
  // moving weights, render the matrix as a signed heatmap so the structure being
  // learned (bright cells in trained rows) is visible at a glance.
  const cellBackground = step === 0 ? stepColormap(step, matrix) : signedColormap(domainMax);
  const { aHead, bHead } = pairFlashStyles(flash);

  const title = (
    <span className={titleStyles.title}>
      <FormulaDisplay inline latex="W" />
      <PhaseTag phase={step <= 1 ? 'before · random init' : 'before step'} parens />
    </span>
  );

  return (
    <Panel
      title={title}
      stage={TrainingStage.Parameters}
      step={step}
      dimmed={false}
      randomInit={step <= 1}
    >
      <Grid
        columnHeaders={[...vocab]}
        rowHeadings={[...vocab]}
        cells={matrix.map(row => row.map(v => v.toFixed(precision)))}
        cellStyle={(i, j) => ({ background: cellBackground(matrix[i][j], i, j) })}
        columnHeaderStyle={j => ({ textAlign: 'center', color: color.text.primary, ...bHead(j) })}
        rowHeadingStyle={i => ({ textAlign: 'right', ...aHead(i) })}
        // This panel shows the PRE-update matrix, so its console snippet must
        // reference the matching scope variable — `W` is the post-update table.
        rowAction={(i) => <JsRowButton snippet={rowSoftmaxSnippet('Wbefore', i)} label={`softmax(Wbefore[${i}])`} />}
      />
    </Panel>
  );
}
