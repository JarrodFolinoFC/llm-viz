import { stepColormap } from '../../core/colormaps';
import { pairFlashStyles } from '../lib/flashStyles';
import { cssVar } from '../lib/cssVars';
import { Grid } from './Grid';
import { NumericCell } from './NumericCell';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';
import { JsRowButton } from './JsRowButton';
import { sumRowSnippet } from '../lib/snippets';
import type { Pair } from '../../core/engine/stepTrainer';

interface PreviousSoftmaxProps {
  vocab: readonly string[];
  matrix: number[][];
  step: number;
  flash?: Pair | null;
  /** Phase tag shown after the formula (overrides the auto "(random)" tag). */
  phase?: string;
}

export function PreviousSoftmax({ vocab, matrix, step, flash, phase }: PreviousSoftmaxProps) {
  const cellBackground = stepColormap(step);
  const { aHead, bHead } = pairFlashStyles(flash);

  const phaseTag = phase ?? (step <= 1 ? '(random)' : null);

  return (
    <Panel
      title={
        <SymbolTitle
          symbol="\operatorname{softmax}(x)_i = \frac{e^{x_i}}{\sum_j e^{x_j}}"
          phase={phaseTag}
        />
      }
      stage={TrainingStage.Forward}
      step={step}
      dimmed={false}
    >
      <Grid
        columnHeaders={[...vocab]}
        rowHeadings={[...vocab]}
        cells={matrix.map(row => row.map(v => <NumericCell value={v} />))}
        cellStyle={(i, j) => ({ background: cellBackground(matrix[i][j], i, j) })}
        columnHeaderStyle={j => ({ textAlign: 'center', color: cssVar.textPrimary, ...bHead(j) })}
        rowHeadingStyle={i => ({ textAlign: 'right', ...aHead(i) })}
        rowAction={(i) => <JsRowButton snippet={sumRowSnippet(matrix[i])} label={`row ${vocab[i]} sums to 1`} />}
      />
    </Panel>
  );
}
