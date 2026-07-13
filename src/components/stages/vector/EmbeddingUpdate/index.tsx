import { Flex } from 'antd';

import { color, space, useViewSettings } from '../../../../theme';
import { signColor, signArrow } from 'mlblocks';
import { FormulaDisplay } from 'mlblocks';
import { Grid } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { Term } from 'mlblocks';
import { TokenChip } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';
import { PhaseTag } from 'mlblocks';
import textStyles from '../../../core/panelText.module.css';
import type { EmbeddingFlash } from '../../../../training/strategies/embedding';

interface EmbeddingUpdateProps {
  vocab: readonly string[];
  step: number;
  dimmed: boolean;
  lr: number;
  flash: EmbeddingFlash | null;
  /** Unembedding matrix before the step — supplies the target token's u_b row. */
  U: number[][];
  /** Weight tying (U = E): each row takes BOTH roles' gradients, so the worked
   *  updates must include the extra term to keep matching the after panel. */
  tied?: boolean;
  /** Muted suffix marking which weights feed the panel, e.g. "(prev-step weights)". */
  phase?: string;
}

/**
 * One vector's worked SGD update, component-by-component: the current vector, its
 * gradient, the −η·gradient step, and the result. Shared by both sides of the
 * embedding update (e_a and u_b) so they read in the same four-column format.
 */
function UpdateTable({
  symbol,
  before,
  grad,
  lr,
}: {
  symbol: string;
  before: number[];
  grad: number[];
  lr: number;
}) {
  const { precision } = useViewSettings();
  // Show η's live value where it's applied, so the −η·∂ step is readable.
  const eta = parseFloat(lr.toFixed(precision));
  const columns = [
    { label: symbol, cells: before, colorFn: () => color.text.secondary },
    { label: `∂L/∂${symbol}`, cells: grad, colorFn: signColor, arrow: true },
    { label: `−η·∂ (η=${eta})`, cells: grad.map((g) => -lr * g), colorFn: signColor, arrow: true },
    {
      label: `${symbol}'`,
      cells: before.map((v, i) => v - lr * grad[i]),
      colorFn: () => color.text.emphasis,
    },
  ];
  return (
    <Grid
      columnHeaders={columns.map((c) => c.label)}
      rowHeadings={before.map((_, i) => `d${i}`)}
      cells={before.map((_, i) =>
        columns.map((col, j) => (
          <NumericCell
            key={j}
            value={col.cells[i]}
            prefix={col.arrow ? signArrow(col.cells[i]) : undefined}
            colorFn={col.colorFn}
          />
        )),
      )}
    />
  );
}

/**
 * The worked vector update for the active pair. Both sides move by the bilinear
 * gradient: e_a ← e_a − η·Σ_b (p_b − y_b)·u_b, and symmetrically the target's
 * u_b ← u_b − η·(p_b − y_b)·e_a. Each is shown component-by-component.
 */
export function EmbeddingUpdate({ vocab, step, dimmed, lr, flash, U, tied = false, phase }: EmbeddingUpdateProps) {
  // ∂L/∂u_b for the target token = (p_b − y_b)·e_a, the symmetric counterpart of
  // the e_a gradient (which sums that quantity over every next token).
  const gradUTarget = flash ? flash.prevE.map((e) => flash.prevGrad[flash.target] * e) : [];
  // Tied (U = E): row a is ALSO unembedding a, so it additionally takes its own
  // u-side nudge (p_a − y_a)·e_a — and if the target is a, its u row takes the
  // e-side pull too. Without these terms the worked e′/u′ columns would stop
  // matching the after-update panel.
  const gradETotal =
    flash && tied
      ? flash.gradE.map((g, i) => g + flash.prevGrad[flash.prev] * flash.prevE[i])
      : flash?.gradE ?? [];
  const gradUTotal =
    flash && tied && flash.target === flash.prev
      ? gradUTarget.map((g, i) => g + flash.gradE[i])
      : gradUTarget;

  return (
    <Panel
      title={
        <span className={titleStyles.titleCentered}>
          <FormulaDisplay inline latex={`e_a \\leftarrow e_a - \\eta \\sum_b (p_b - y_b)\\, u_b`} />
          <Term
            label="vector update"
            explain="The prev token's embedding e_a moves by −η times the gradient summed over every next token: each next token b pulls e_a toward (or away from) its unembedding u_b in proportion to (p_b − y_b). Symmetrically, every u_b is nudged by −η·(p_b − y_b)·e_a. This bilinear gradient is the dot-product score's backward pass — the seed of attention's QKᵀ."
            formula="\\partial L/\\partial e_a = \\textstyle\\sum_b (p_b - y_b)\\, u_b"
          />
          <PhaseTag phase={phase} />
        </span>
      }
      stage={TrainingStage.Update}
      step={step}
      dimmed={dimmed}
    >
      {flash ? (
        <Flex vertical gap={space.md}>
          <div>
            <div className={textStyles.hintCaption}>
              updating <TokenChip text={vocab[flash.prev]} isPrev /> embedding eₐ
              {tied && ' (tied: + its own u-side (pₐ − yₐ)·eₐ)'}
            </div>
            <UpdateTable symbol="eₐ" before={flash.prevE} grad={gradETotal} lr={lr} />
          </div>

          <div>
            <div className={textStyles.hintCaption}>
              updating <TokenChip text={vocab[flash.target]} /> unembedding u_b
              {tied && flash.target === flash.prev && ' (tied: + the e-side pull)'}
            </div>
            <UpdateTable symbol="u_b" before={U[flash.target] ?? []} grad={gradUTotal} lr={lr} />
          </div>
        </Flex>
      ) : (
        <div className={textStyles.hint}>
          Step ×1 to see the embedding update worked out.
        </div>
      )}
    </Panel>
  );
}
