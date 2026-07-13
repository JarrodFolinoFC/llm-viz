import { cssVar } from '../lib/cssVars';
import type { StepPanelProps } from '../flow/panelProps';
import { signColor, signArrow } from '../flow/signedCell';
import { ColumnGrid, candidateRowLabels, pairRowLabels, type ColumnDef } from './ColumnGrid';
import { FormulaDisplay } from './FormulaDisplay';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { Term } from './Term';
import { TokenChip } from './TokenChip';
import { JsRowButton } from './JsRowButton';
import { gradientRowSnippet } from '../lib/snippets';
import { PhaseTag } from './PhaseTag';
import { useP } from '../primitives/context';
import { textStyles } from './textStyles';

interface GradientColumnProps extends StepPanelProps {
  matrix: number[][];
  /** Muted suffix marking which weights feed the panel, e.g. "(prev-step weights)". */
  phase?: string;
  /** LaTeX symbol for the logit being differentiated (default "x"). The MLP
   *  passes "\\ell" so ∂L/∂ℓ matches the softmax panel and doesn't read as the
   *  input embeddings x. */
  logitSymbol?: string;
  /** The full conditioning context token ids (the MLP's N previous tokens).
   *  When given, rows are candidate-only and the context is named once in the
   *  title — mirroring {@link RowSoftmax}, so the p−y panel doesn't imply a
   *  single-token (bigram) conditioning the MLP doesn't have. */
  contextTokens?: number[];
}

export function GradientColumn({ vocab, step, flash, dimmed, matrix, phase, logitSymbol = 'x', contextTokens }: GradientColumnProps) {
  const P = useP();
  const target = flash?.target;
  const contextMode = contextTokens != null;
  const rowLabels = contextMode
    ? candidateRowLabels(vocab, target)
    : pairRowLabels(vocab, flash?.prev, target);

  const columns: ColumnDef[] = [
    {
      label: 'p',
      cells: matrix.map(([p]) => ({ value: p, colorFn: () => cssVar.textSecondary })),
    },
    {
      label: 'y',
      cells: matrix.map(([, y]) => ({
        value: y,
        decimals: 2,
        colorFn: (_v: number, hi: boolean) => hi ? cssVar.textEmphasis : cssVar.textMuted,
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
  ];

  return (
    <Panel
      title={
        <P.View inline align="center" gap="sm">
          <FormulaDisplay inline latex={`\\frac{\\partial \\mathcal{L}}{\\partial ${logitSymbol}_i} = p_i - y_i`} />
          <Term
            label="why p − y?"
            explain="y is the one-hot correct next token (1 for the target, 0 elsewhere). The full chain rule of cross-entropy after softmax collapses to exactly probs − one_hot — so the gradient is just 'predicted minus actual'. It pushes the target's logit up and every other logit down."
          />
          {contextMode && contextTokens.length > 0 && (
            <P.View inline align="center" gap={4} sty={textStyles.phase}>
              given
              {contextTokens.map((t, p) => (
                <TokenChip key={p} text={vocab[t]} isPrev />
              ))}
            </P.View>
          )}
          <PhaseTag phase={phase} />
        </P.View>
      }
      dimmed={dimmed} step={step}
      stage={TrainingStage.Backprop}
    >
      <ColumnGrid
        columns={columns}
        rowLabels={rowLabels}
        highlightedRow={target}
        rowAction={(i) => <JsRowButton snippet={gradientRowSnippet(matrix[i][0], matrix[i][1])} label={`p − y for ${vocab[i]}`} />}
      />
    </Panel>
  );
}
