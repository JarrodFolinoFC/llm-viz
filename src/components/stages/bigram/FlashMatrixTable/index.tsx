import { signedColormap, stepColormap } from 'mlblocks/core';
import { pairFlashStyles } from 'mlblocks';
import { color, useViewSettings } from '../../../../theme';
import { FormulaDisplay } from 'mlblocks';
import { Grid, StackedCell } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { PhaseTag } from 'mlblocks';
import { signColor, signArrow } from 'mlblocks';
import { JsRowButton } from 'mlblocks';
import { rowSoftmaxSnippet } from 'mlblocks';
import type { BigramFlash } from '../../../../training/strategies/bigram';
import styles from '../../../core/panelTitles.module.css';

interface FlashMatrixTableProps {
  vocab: readonly string[];
  step: number;
  matrix: number[][];
  /** max |w| over the matrix — the heatmap domain (view-model computed). */
  domainMax: number;
  flash: BigramFlash | null;
  /** Per-column change applied to the trained row this step (W − prevRow). */
  flashDeltas: number[] | null;
}

export function FlashMatrixTable({
  vocab,
  step,
  matrix,
  domainMax,
  flash,
  flashDeltas,
}: FlashMatrixTableProps) {
  const { precision } = useViewSettings();
  const { aHead, bHead } = pairFlashStyles(flash);
  // Step 0 is the same untrained matrix as the "before" panel — keep it the same
  // neutral grey rather than implying an update already happened.
  const cellBackground = step === 0 ? stepColormap(step, matrix) : signedColormap(domainMax);
  const trainedRow = flash?.prev ?? null;

  const title = (
    <span className={styles.title}>
      <FormulaDisplay inline latex="W" />
      <PhaseTag phase="after step" />
    </span>
  );

  return (
    <Panel
      title={title}
      stage={TrainingStage.Update}
      step={step}
      dimmed={false}
    >
      <Grid
        columnHeaders={[...vocab]}
        rowHeadings={[...vocab]}
        cells={matrix.map((row, i) =>
          row.map((v, j) => {
            // Surface the SGD delta on the row that just moved; skip cells whose
            // change rounds to zero so we never show a misleading "↑ 0.00".
            const delta = flashDeltas && i === trainedRow ? flashDeltas[j] : null;
            const annotations =
              delta != null && Math.abs(delta) >= 0.5 * 10 ** -precision
                ? [
                    <span style={{ color: signColor(delta) }}>
                      {signArrow(delta)}&nbsp;{Math.abs(delta).toFixed(precision)}
                    </span>,
                  ]
                : [];
            return <StackedCell annotations={annotations} main={v.toFixed(precision)} />;
          }),
        )}
        cellStyle={(i, j) => ({ background: cellBackground(matrix[i][j], i, j) })}
        columnHeaderStyle={j => ({ textAlign: 'center', color: color.text.primary, ...bHead(j) })}
        rowHeadingStyle={i => ({ textAlign: 'right', ...aHead(i) })}
        rowAction={(i) => <JsRowButton snippet={rowSoftmaxSnippet('W', i)} label={`softmax(W[${i}])`} />}
      />
    </Panel>
  );
}
