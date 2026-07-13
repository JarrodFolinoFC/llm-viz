import { useState } from 'react';
import { Modal } from 'antd';
import { color } from '../../../../theme';
import type { Matrix } from 'mlblocks/core';
import type { Pair } from 'mlblocks/core';
import type { EmbeddingFlash } from '../../../../training/strategies/embedding';
import { ExpShiftedHeader } from 'mlblocks';
import { signColor, signArrow } from 'mlblocks';
import { FormulaDisplay } from 'mlblocks';
import { Grid } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { Term } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';
import { PhaseTag } from 'mlblocks';
import textStyles from '../../../core/panelText.module.css';
import styles from './DotProduct.module.css';

interface DotProductProps {
  vocab: readonly string[];
  step: number;
  dimmed: boolean;
  flash: EmbeddingFlash | null;
  currentPair: Pair;
  /** Pre-step embeddings — the dot product is shown before the update. */
  EBefore: Matrix;
  UBefore: Matrix;
  /** [logit, eˣ, prob] per candidate next token — the softmax of this row. */
  softmaxRows: number[][];
  /** Show the Σ eˣ total (the softmax denominator) beneath the table. */
  showSum?: boolean;
  /** Muted suffix marking which weights feed the panel, e.g. "(prev-step weights)". */
  phase?: string;
}

/**
 * The whole forward pass for the active prev token, one row per candidate next
 * token: its fixed embedding e_a is dotted against every candidate's unembedding
 * u_b to a logit x = e_a · u_b, then that row is run through softmax (eˣ and
 * p = eˣ/Σ). Clicking a logit cell opens a modal with the component-by-component
 * working (e_a, u_b, their products, and the sum). The active target is
 * highlighted. The dot product is the kernel attention's QKᵀ scales up — a score
 * is just "how aligned are these two vectors".
 */
export function DotProduct({
  vocab, step, dimmed, flash, EBefore, UBefore, softmaxRows, showSum, phase,
}: DotProductProps) {
  const [openB, setOpenB] = useState<number | null>(null);
  const title = (
    <span className={titleStyles.titleCentered}>
      <FormulaDisplay inline latex={`p = \\mathrm{softmax}(e_a \\cdot u_b)`} />
      <Term
        label="why a dot product?"
        explain="A logit scores how well the previous token's embedding e_a aligns with a candidate next token's unembedding u_b. The dot product is large when the two vectors point the same way and negative when they oppose — so training pushes e_a toward the u of words that actually follow. This alignment-as-score is exactly what attention's QKᵀ generalises."
      />
      <PhaseTag phase={phase} />
    </span>
  );

  // Before any step is taken (step 0) there is no worked pair yet — nothing to
  // compute. Match the other worked-example panels and show a hint instead.
  if (!flash) {
    return (
      <Panel
        title={title}
        stage={TrainingStage.Forward}
        dimmed={dimmed}
        step={step}
      >
        <div className={textStyles.hint}>
          Nothing to calculate yet — take a step (×1) to work out the dot product.
        </div>
      </Panel>
    );
  }

  const { prev, target } = flash;
  const eVec = flash.prevE ?? EBefore[prev] ?? [];
  // The target row (the trained next token) flashes blue — matching the
  // u/target colour used in the E,U and softmax panels.
  const targetHead = { background: color.chip.nextBg, color: color.chip.nextFg, fontWeight: 'bold' as const };

  // The component-by-component working for the candidate whose logit was clicked.
  const openUVec = openB != null ? UBefore[openB] ?? [] : [];
  const openProducts = eVec.map((e, k) => e * (openUVec[k] ?? 0));
  const openLogit = openProducts.reduce((s, p) => s + p, 0);

  return (
    <Panel
      title={title}
      dimmed={dimmed}
      stage={TrainingStage.Forward}
      step={step}
    >
      <div className={styles.body}>
        <Grid
          columnHeaders={['x = eₐ·u', <ExpShiftedHeader />, 'p = eˣ⁻ᵐᵃˣ/Σ']}
          rowHeadings={[...vocab]}
          cells={vocab.map((_, b) => {
            const uVec = UBefore[b] ?? [];
            const x = eVec.reduce((s, e, k) => s + e * (uVec[k] ?? 0), 0);
            const ex = softmaxRows[b]?.[1] ?? 0;
            const p = softmaxRows[b]?.[2] ?? 0;
            return [
              <button
                type="button"
                className={styles.logitButton}
                onClick={() => setOpenB(b)}
                title="Click for the full working"
              >
                <NumericCell value={x} signed prefix={signArrow(x)} colorFn={() => signColor(x)} />
              </button>,
              <NumericCell value={ex} colorFn={() => color.text.secondary} />,
              <NumericCell value={p} colorFn={() => color.text.emphasis} />,
            ];
          })}
          columnHeaderStyle={() => ({ textAlign: 'center', color: color.text.primary })}
          rowHeadingStyle={(i) => ({ textAlign: 'right', ...(i === target ? targetHead : undefined) })}
          cellStyle={(i) => (i === target ? { background: color.chip.nextBg } : undefined)}
          highlightedRow={target}
          rollup={
            showSum
              ? {
                  label: 'Σ',
                  cells: [
                    '',
                    <NumericCell value={softmaxRows.reduce((s, r) => s + (r[1] ?? 0), 0)} colorFn={() => color.text.secondary} />,
                    <NumericCell value={softmaxRows.reduce((s, r) => s + (r[2] ?? 0), 0)} colorFn={() => color.text.emphasis} />,
                  ],
                }
              : undefined
          }
        />
      </div>

      <Modal
        open={openB != null}
        onCancel={() => setOpenB(null)}
        footer={null}
        title={openB != null ? `logit(${vocab[prev]} → ${vocab[openB]}) = eₐ · u_b` : ''}
      >
        {openB != null && (
          <div className={styles.workingBody}>
            <Grid
              columnHeaders={['eₐ', 'u_b', 'eₐ × u_b']}
              rowHeadings={eVec.map((_, k) => `d${k}`)}
              cells={eVec.map((e, k) => [
                <NumericCell value={e} signed colorFn={() => color.text.secondary} />,
                <NumericCell value={openUVec[k] ?? 0} signed colorFn={() => color.text.secondary} />,
                <NumericCell value={openProducts[k]} signed colorFn={() => signColor(openProducts[k])} />,
              ])}
              columnHeaderStyle={() => ({ textAlign: 'center', color: color.text.primary })}
              rowHeadingStyle={() => ({ textAlign: 'right' })}
            />
            <div className={styles.logitFooter}>
              <span className={styles.logitFooterLabel}>Σ = logit({vocab[prev]}→{vocab[openB]})</span>
              <strong className={styles.logitValue}>
                <NumericCell value={openLogit} signed colorFn={() => signColor(openLogit)} />
              </strong>
            </div>
          </div>
        )}
      </Modal>
    </Panel>
  );
}
