import { Panel } from 'shared-ui';

import { color } from '../../../../theme';
import { Grid } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import { signColor, signArrow } from 'mlblocks';
import { FormulaDisplay } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';

interface HiddenLayerProps {
  /** Pre-activations z₁ = x·W₁ + b₁ (length H). */
  z1: number[];
  /** Activations h = tanh(z₁) (length H). */
  hidden: number[];
  /** Title formula (LaTeX) — override for non-MLP hidden states (e.g. the RNN's). */
  formula?: string;
  /** Column headers — override alongside `formula`. */
  zLabel?: string;
  hLabel?: string;
}

/**
 * A tanh hidden layer/state: H pre-activations squashed to H activations.
 * Defaults to the MLP's labels; the RNN inference page relabels it as the
 * recurrence's final step.
 */
export function HiddenLayer({
  z1,
  hidden,
  formula = 'h = \\tanh(x W_1 + b_1)',
  zLabel = 'z₁ = x·W₁+b₁',
  hLabel = 'h = tanh(z₁)',
}: HiddenLayerProps) {
  const title = (
    <span className={titleStyles.titleCentered}>
      <FormulaDisplay inline latex={formula} />
    </span>
  );
  return (
    <Panel title={title}>
      <Grid
        columnHeaders={[zLabel, hLabel]}
        rowHeadings={hidden.map((_, j) => `h${j}`)}
        cells={z1.map((z, j) => [
          <NumericCell value={z} signed prefix={signArrow(z)} colorFn={() => signColor(z)} />,
          <NumericCell value={hidden[j]} signed colorFn={() => signColor(hidden[j])} />,
        ])}
        columnHeaderStyle={() => ({ textAlign: 'center', color: color.text.primary })}
        rowHeadingStyle={() => ({ textAlign: 'right' })}
      />
    </Panel>
  );
}
