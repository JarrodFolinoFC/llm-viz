import { useState } from 'react';

import { useP } from '../primitives/context';
import { textStyles } from './textStyles';

import { cssVar } from '../lib/cssVars';
import type { StepPanelProps } from '../flow/panelProps';
import { signColor, signArrow } from '../flow/signedCell';
import { ColumnGrid, ExpShiftedHeader, candidateRowLabels, pairRowLabels, type ColumnDef } from './ColumnGrid';
import { FormulaDisplay } from './FormulaDisplay';
import { Grid } from './Grid';
import { NumericCell } from './NumericCell';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';
import { Term } from './Term';
import { TokenChip } from './TokenChip';
import { JsRowButton } from './JsRowButton';
import { softmaxRowSnippet } from '../lib/snippets';
import { PhaseTag } from './PhaseTag';

/**
 * MLP-only extras that let each candidate's logit be expanded in the click-to-
 * open modal: ℓ_k = h · W₂[:,k] + b₂[k]. When absent (bigram/vector) the rows
 * aren't clickable and no modal renders.
 */
export interface LogitParts {
  /** Hidden activations h — the W₂ input (length H). */
  hidden: number[];
  /** H×V output weights. */
  W2: number[][];
  /** V output biases. */
  b2: number[];
  /** Labels for the hidden units (h0…h_{H−1}) — the modal's rows. */
  hiddenLabels: string[];
}

/**
 * The click-to-open worked calculation for one candidate `k`: how its logit is
 * built (h · W₂[:,k] + b₂[k]), then how softmax turns that logit into p. Every
 * number here is the same one shown on the panels around it — the hidden layer's
 * h, the W₂/b₂ parameters, and this panel's own ℓ/eˣ/Σ — so a learner can trace
 * the whole path h → ℓ → p.
 */
function SoftmaxWorking({
  k,
  vocab,
  logits,
  exps,
  sumExp,
  probs,
  parts,
}: {
  k: number;
  vocab: readonly string[];
  logits: number[];
  exps: number[];
  sumExp: number;
  probs: number[];
  parts: LogitParts;
}) {
  const P = useP();
  const { hidden, W2, b2, hiddenLabels } = parts;
  const word = vocab[k] ?? `#${k}`;
  const products = hidden.map((hj, j) => hj * (W2[j]?.[k] ?? 0));
  const dotHW2 = products.reduce((a, b) => a + b, 0);
  const logit = logits[k] ?? 0;
  const finite = logits.filter((v) => Number.isFinite(v));
  const maxLogit = finite.length ? Math.max(...finite) : 0;
  const secondary = () => cssVar.textSecondary;
  const emphasis = () => cssVar.textEmphasis;

  return (
    <P.View direction="col" gap="lg">
      {/* 1 · the logit, as a dot product of the hidden layer with W₂'s column. */}
      <P.View direction="col" gap="sm">
        <SymbolTitle symbol={`\\ell = h \\cdot W_2[:,\\text{${word}}] + b_2`} phase="one product per hidden unit, summed" />
        <Grid
          columnHeaders={['h', `W₂[·][${word}]`, 'h · W₂']}
          rowHeadings={hiddenLabels}
          cells={hidden.map((hj, j) => [
            <NumericCell value={hj} signed colorFn={secondary} />,
            <NumericCell value={W2[j]?.[k] ?? 0} signed colorFn={secondary} />,
            <NumericCell value={products[j]} signed colorFn={() => signColor(products[j])} />,
          ])}
          rowHeadingStyle={() => ({ textAlign: 'right' })}
          columnHeaderStyle={() => ({ textAlign: 'right', color: cssVar.textPrimary })}
          rollups={[
            { label: <SymbolTitle symbol="\Sigma = h \cdot W_2" />, cells: ['', '', <NumericCell value={dotHW2} signed />] },
            { label: <SymbolTitle symbol="+\, b_2" />, cells: ['', '', <NumericCell value={b2[k] ?? 0} signed colorFn={secondary} />] },
            { label: <SymbolTitle symbol="\ell = h\cdot W_2 + b_2" />, cells: ['', '', <NumericCell value={logit} signed colorFn={emphasis} />] },
          ]}
        />
      </P.View>

      {/* 2 · softmax over the logits: shift by the row max, exponentiate, ÷ Σ. */}
      <P.View direction="col" gap="sm">
        <SymbolTitle symbol={`p_{\\text{${word}}} = \\frac{e^{\\ell - \\max}}{\\sum_j e^{\\ell_j - \\max}}`} phase="the max shift cancels in ÷ Σ" />
        <Grid
          columnHeaders={['value']}
          rowHeadings={[
            <FormulaDisplay inline latex="\ell" />,
            <FormulaDisplay inline latex="\max_j \ell_j" />,
            <FormulaDisplay inline latex="\ell - \max" />,
            <FormulaDisplay inline latex="e^{\ell - \max}" />,
            <FormulaDisplay inline latex="\sum_j e^{\ell_j - \max}" />,
            <FormulaDisplay inline latex="p = e^{\ell - \max} / \Sigma" />,
          ]}
          cells={[
            [<NumericCell value={logit} signed />],
            [<NumericCell value={maxLogit} signed colorFn={secondary} />],
            [<NumericCell value={logit - maxLogit} signed />],
            [<NumericCell value={exps[k] ?? 0} colorFn={secondary} />],
            [<NumericCell value={sumExp} colorFn={secondary} />],
            [<NumericCell value={probs[k] ?? 0} colorFn={emphasis} />],
          ]}
          rowHeadingStyle={() => ({ textAlign: 'right' })}
          columnHeaderStyle={() => ({ textAlign: 'right', color: cssVar.textSecondary })}
        />
      </P.View>
    </P.View>
  );
}

interface RowSoftmaxProps extends StepPanelProps {
  matrix: number[][];
  /** Muted suffix marking which weights feed the panel, e.g. "(prev-step weights)". */
  phase?: string;
  /** Header for the logit column — names where the logit came from for this
   *  stage (e.g. "x = Wₐ,ᵢ" scalar, "x = eₐ·u" vector, "ℓ = h·W₂+b₂" MLP). */
  logitLabel?: string;
  /** LaTeX symbol for the logit vector (default "x"). The MLP passes "\\ell" so
   *  the softmax formula/headers don't collide with the input embeddings x. */
  logitSymbol?: string;
  /**
   * The full conditioning context token ids (the MLP's N previous tokens). When
   * given, the panel drops the per-row single-"prev" chip — which would imply a
   * bigram lookup — and instead names the whole context once in the title, so
   * the single distribution reads as p(next | entire context).
   */
  contextTokens?: number[];
  /** MLP-only: when given, each row is clickable and opens a worked calculation
   *  expanding its logit (ℓ = h·W₂ + b₂) and the softmax that follows. */
  logitParts?: LogitParts;
}

export function RowSoftmax({ vocab, step, flash, dimmed, matrix, phase, logitLabel = 'x = Wₐ,ᵢ', logitSymbol = 'x', contextTokens, logitParts }: RowSoftmaxProps) {
  const P = useP();
  // Optional detail-dialog slot, hoisted so TS narrows it (native v1: absent →
  // rows aren't clickable and no dialog renders).
  const DetailModal = P.Modal;
  const target = flash?.target;
  const [openRow, setOpenRow] = useState<number | null>(null);
  // MLP: condition on the whole context (candidate-only rows + a "given" caption);
  // bigram/vector: the classic prev→candidate pair rows.
  const contextMode = contextTokens != null;
  const rowLabels = contextMode
    ? candidateRowLabels(vocab, target)
    : pairRowLabels(vocab, flash?.prev, target);
  const logits = matrix.map(([x]) => x);
  const sumExp = matrix.reduce((s, [, ex]) => s + (ex ?? 0), 0);
  const sumP = matrix.reduce((s, [, , p]) => s + (p ?? 0), 0);

  const columns: ColumnDef[] = [
    {
      label: logitLabel,
      cells: matrix.map(([x]) => ({
        value: x,
        prefix: signArrow(x),
        colorFn: () => signColor(x),
      })),
    },
    {
      label: <ExpShiftedHeader symbol={logitSymbol} />,
      cells: matrix.map(([, ex]) => ({ value: ex, colorFn: () => cssVar.textSecondary })),
    },
    {
      label:
        logitSymbol === 'x' ? (
          'p = eˣ⁻ᵐᵃˣ/Σ'
        ) : (
          <FormulaDisplay inline latex={`p = e^{${logitSymbol} - \\max} / \\Sigma`} />
        ),
      cells: matrix.map(([, , p]) => ({ value: p, colorFn: () => cssVar.textEmphasis })),
    },
  ];

  return (
    <Panel
      title={
        <P.View inline align="center" gap="sm">
          <FormulaDisplay inline latex={`p_i = \\frac{e^{${logitSymbol}_i}}{\\sum_j e^{${logitSymbol}_j}}`} />
          {contextMode ? (
            <Term
              label="p(next | context)"
              explain="One distribution, not one per input token: the hidden vector h already summarises the whole context (all N previous tokens together), so logits = h·W₂ + b₂ score every candidate next token at once, and softmax turns them into a single probability distribution over the vocabulary. The MLP predicts one next token from the whole context — that's why there's just one softmax."
              formula="p = \\text{softmax}(h\\cdot W_2 + b_2)"
            />
          ) : (
            <Term
              label="row a"
              explain="x is row a of W — the logits for 'what comes after token a'. Indexing a row is the same as onehot(a) · W, so an embedding lookup is just a matmul. softmax turns those logits into a probability distribution over the next token."
              formula="\\text{softmax}(\\,\\text{onehot}(a)\\cdot W\\,)"
            />
          )}
          {contextMode && contextTokens.length > 0 && (
            <P.View inline align="center" gap={4} sty={textStyles.phase}>
              given
              {contextTokens.map((t, p) => (
                <TokenChip key={p} text={vocab[t]} isPrev />
              ))}
            </P.View>
          )}
          {/* Step 0 shows the untrained forward pass, dimmed — same policy as the
              gradient column, so the row reads consistently before training. */}
          <PhaseTag phase={step === 0 ? '(untrained)' : phase} />
        </P.View>
      }
      stage={TrainingStage.Forward}
      step={step}
      dimmed={dimmed}
    >
      <ColumnGrid
        columns={columns}
        rowLabels={rowLabels}
        highlightedRow={target}
        onRowClick={logitParts && DetailModal ? setOpenRow : undefined}
        // Column totals: Σeˣ IS the softmax denominator, and Σp = 1 is the
        // probability-distribution invariant — both worth seeing every step.
        rollup={{
          label: (
            <Term
              label="Σ"
              explain="Column totals. Σ eˣ⁻ᵐᵃˣ is the denominator every p is divided by; the p column then sums to 1 — that's what makes it a probability distribution."
            />
          ),
          cells: [
            '',
            <NumericCell value={sumExp} colorFn={() => cssVar.textSecondary} />,
            <NumericCell value={sumP} colorFn={() => cssVar.textEmphasis} />,
          ],
        }}
        rowAction={(i) => <JsRowButton snippet={softmaxRowSnippet(logits, i)} label={`p for ${vocab[i]}`} />}
      />

      {/* Click a row → its full worked calculation (MLP only). Mask-less so you
          can click another row to switch the working live. */}
      {logitParts && DetailModal && (
        <DetailModal
          open={openRow != null}
          onClose={() => setOpenRow(null)}
          width={480}
          title={openRow != null ? `p("${vocab[openRow]}") — full calculation` : ''}
        >
          {openRow != null && (
            <SoftmaxWorking
              k={openRow}
              vocab={vocab}
              logits={logits}
              exps={matrix.map(([, ex]) => ex ?? 0)}
              sumExp={sumExp}
              probs={matrix.map(([, , p]) => p ?? 0)}
              parts={logitParts}
            />
          )}
        </DetailModal>
      )}
    </Panel>
  );
}
