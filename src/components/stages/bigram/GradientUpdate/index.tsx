import { color } from '../../../../theme';
import type { BigramFlash } from '../../../../training/strategies/bigram';
import type { StepPanelProps } from 'mlblocks';
import { signColor, signArrow } from 'mlblocks';
import { ColumnGrid, pairRowLabels, type ColumnDef } from 'mlblocks';
import { FormulaDisplay } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { Term } from 'mlblocks';
import { JsRowButton } from 'mlblocks';
import { gradientRowSnippet } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';

interface GradientUpdateProps extends StepPanelProps {
  flash: BigramFlash | null;
  /** One row per vocab token: [p, y, p − y]. */
  matrix: number[][];
  /** −η(p − y) per vocab token — the step SGD applies to row a. */
  updates: number[];
}

/**
 * Backprop and the update it prescribes, merged into one table: the gradient
 * columns (p, y, p − y) run straight into −η(p − y) — the nudge applied to
 * W's row a — so the reader follows a single row across the whole story
 * instead of re-finding it in a second panel. Row a's current weights lead
 * the table while a worked step is on show.
 */
export function GradientUpdate({ vocab, step, dimmed, flash, matrix, updates }: GradientUpdateProps) {
  const rowLabels = pairRowLabels(vocab, flash?.prev, flash?.target);

  const columns: ColumnDef[] = [
    ...(flash?.prevRow
      ? [
          {
            label: 'Wₐ,ᵢ',
            cells: flash.prevRow.map((old) => ({
              value: old,
              colorFn: () => color.text.secondary,
            })),
          },
        ]
      : []),
    {
      label: 'p',
      cells: matrix.map(([p]) => ({ value: p, colorFn: () => color.text.secondary })),
    },
    {
      label: 'y',
      cells: matrix.map(([, y]) => ({
        value: y,
        decimals: 2,
        colorFn: (_v: number, hi: boolean) => hi ? color.text.emphasis : color.text.muted,
      })),
    },
    {
      label: 'p − y',
      cells: matrix.map(([, , g]) => ({
        value: g,
        prefix: signArrow(g),
        colorFn: () => signColor(g),
      })),
    },
    {
      label: '−η(p − y)',
      cells: updates.map((u) => ({
        value: u,
        prefix: signArrow(u),
        colorFn: () => signColor(u),
      })),
    },
  ];

  return (
    <Panel
      title={
        <span className={titleStyles.titleCentered}>
          <FormulaDisplay inline latex={`\\frac{\\partial \\mathcal{L}}{\\partial x_i} = p_i - y_i`} />
          <Term
            label="why p − y?"
            explain="y is the one-hot correct next token (1 for the target, 0 elsewhere). The full chain rule of cross-entropy after softmax collapses to exactly probs − one_hot — so the gradient is just 'predicted minus actual'. It pushes the target's logit up and every other logit down."
          />
          <FormulaDisplay inline latex={`W_{a,i} \\leftarrow W_{a,i} - \\eta \\, (p_i - y_i)`} />
          <Term
            label="update"
            explain="Subtract the learning rate η times the gradient from each weight in row a. Because −η(p − y) is negative where the model over-predicted and positive at the target, this nudges row a toward the correct next token by a small step."
            formula="\\theta \\leftarrow \\theta - \\eta \\, \\nabla_\\theta \\mathcal{L}"
          />
        </span>
      }
      stage={TrainingStage.Backprop}
      step={step}
      dimmed={dimmed}
    >
      <ColumnGrid
        columns={columns}
        rowLabels={rowLabels}
        highlightedRow={flash?.target}
        rowAction={(i) => <JsRowButton snippet={gradientRowSnippet(matrix[i][0], matrix[i][1])} label={`p − y for ${vocab[i]}`} />}
      />
    </Panel>
  );
}
