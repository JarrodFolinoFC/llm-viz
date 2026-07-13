import type { ReactNode } from 'react';
import { Panel } from 'shared-ui';

import { color } from '../../../../theme';
import { ColumnGrid, ExpShiftedHeader, pairRowLabels, type ColumnDef } from 'mlblocks';
import { signColor, signArrow } from 'mlblocks';
import { FormulaDisplay } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import { Term } from 'mlblocks';
import { TokenChip } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';

interface SoftmaxProps {
  vocab: readonly string[];
  /** `[logit, eˣ, probability]` per next token. */
  matrix: number[][];
  current: number;
  predicted: number;
  /** Header for the logit column — names where x came from for this model. */
  logitLabel?: string;
  /** Title suffix after the formula (defaults to "softmax of row <current>"). */
  subtitle?: ReactNode;
}

/**
 * Turn a row of logits into a probability distribution over the next token:
 * p_i = e^{x_i} / Σ e^{x_j}. The predicted (argmax) row is highlighted. The logit
 * column header and the title suffix are model-specific (a free row of W, a dot
 * product, or an MLP output), passed in by the container.
 */
export function Softmax({
  vocab,
  matrix,
  current,
  predicted,
  logitLabel = 'x = Wₐ,ᵢ',
  subtitle,
}: SoftmaxProps) {
  const rowLabels = pairRowLabels(vocab, current, predicted);
  const sumExp = matrix.reduce((s, [, ex]) => s + (ex ?? 0), 0);
  const sumP = matrix.reduce((s, [, , p]) => s + (p ?? 0), 0);

  const columns: ColumnDef[] = [
    {
      label: logitLabel,
      cells: matrix.map(([x]) => ({ value: x, prefix: signArrow(x), colorFn: () => signColor(x) })),
    },
    {
      label: <ExpShiftedHeader />,
      cells: matrix.map(([, ex]) => ({ value: ex, colorFn: () => color.text.secondary })),
    },
    {
      label: 'p = eˣ⁻ᵐᵃˣ/Σ',
      cells: matrix.map(([, , p]) => ({ value: p, colorFn: () => color.text.emphasis })),
    },
  ];

  const title = (
    <span className={titleStyles.titleCentered}>
      <FormulaDisplay inline latex={`p_i = \\frac{e^{x_i}}{\\sum_j e^{x_j}}`} />
      <span>
        {subtitle ?? (
          <>
            — softmax of row <TokenChip text={vocab[current]} isPrev />
          </>
        )}
      </span>
    </span>
  );

  return (
    <Panel title={title}>
      <ColumnGrid
        columns={columns}
        rowLabels={rowLabels}
        highlightedRow={predicted}
        // Same Σ rollup as the training RowSoftmax, so the two tables read alike.
        rollup={{
          label: (
            <Term
              label="Σ"
              explain="Column totals. Σ eˣ⁻ᵐᵃˣ is the denominator every p is divided by; the p column then sums to 1 — that's what makes it a probability distribution."
            />
          ),
          cells: [
            '',
            <NumericCell value={sumExp} colorFn={() => color.text.secondary} />,
            <NumericCell value={sumP} colorFn={() => color.text.emphasis} />,
          ],
        }}
      />
    </Panel>
  );
}
