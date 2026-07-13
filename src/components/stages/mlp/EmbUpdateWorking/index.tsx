import type { ReactNode } from 'react';

import { color } from '../../../../theme';
import { signedColormap } from 'mlblocks/core';
import { maxAbs } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import { Grid, StackedCell } from 'mlblocks';
import { NumericCell } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import { SymbolTitle } from 'mlblocks';

interface EmbUpdateWorkingProps {
  vocab: readonly string[];
  /** The N context token ids of the displayed example. */
  context: number[];
  /** V × d embeddings (before the step). */
  E: Matrix;
  /** (N·d) × H hidden weights (before the step). */
  W1: Matrix;
  /** H hidden pre-activation gradients ∇z₁. */
  dz1: number[];
  /** V × d embedding deltas (−η·∇E). */
  deltaE: Matrix;
  /** V × d embeddings after the step. */
  Eafter: Matrix;
  /** Learning rate η. */
  lr: number;
  step: number;
  dimmed?: boolean;
}

/**
 * The embedding update, worked out end to end for the live example — the panel
 * form of "where does ΔE come from?".
 *
 * Only the tokens in the context get a gradient (E feeds the net only as the
 * input lookup), so there's one column per context input slot. Each body cell
 * is the product W₁[slot][j]·∇z₁[j] (the row heading carries ∇z₁[j], the shared
 * factor; the cell's small annotation carries the W₁ factor), and the rollups
 * chain it to the update:
 *
 *   Σⱼ W₁[slot][j]·∇z₁[j] = ∇E   →   ×(−η) = ΔE   →   E + ΔE = E after
 *
 * i.e. ∇xᵢ = Σⱼ W₁[i][j]·∇z₁[j] scattered back to the token's E row, then plain
 * SGD. Mirrors {@link HiddenPreActivation}'s per-product layout, one step later
 * in the pipeline.
 */
export function EmbUpdateWorking({ vocab, context, E, W1, dz1, deltaE, Eafter, lr, step, dimmed = false }: EmbUpdateWorkingProps) {
  const d = E[0]?.length ?? 0;
  const H = W1[0]?.length ?? 0;

  // This worked example assumes each context token occupies its own slot(s): the
  // per-slot Σ = ∇E column then equals that token's *full* ∇E, so ×(−η) = ΔE and
  // E + ΔE = E after read consistently down each column. If a token repeats
  // within one context its ∇E accumulates across slots (backwardPass sums them),
  // while the ΔE / E-after rows are per-token — so the arithmetic under the
  // repeated token's columns would visibly disagree. No shipped corpus repeats a
  // token inside a blockSize window; guard so a future corpus swap fails loudly
  // here (aggregate the repeated slots into one column) rather than silently
  // rendering wrong sums.
  if (import.meta.env.DEV && new Set(context).size !== context.length) {
    console.error(
      'EmbUpdateWorking: a context token repeats within the block; the per-slot ΔE / E-after rollups are only correct for distinct context tokens. Aggregate the repeated slots by token before using such a corpus.',
    );
  }

  // One column per context input slot: position p, embedding dim dd → row p·d+dd.
  const slots = context.flatMap((token, p) =>
    Array.from({ length: d }, (_, dd) => ({ token, p, dd, row: p * d + dd })),
  );

  const products = slots.map(({ row }) => Array.from({ length: H }, (_, j) => (W1[row]?.[j] ?? 0) * (dz1[j] ?? 0)));
  const gradE = slots.map((_, c) => products[c].reduce((acc, _v, j) => acc + products[c][j], 0));
  const tint = signedColormap(maxAbs(products.length ? products : [[0]]));

  const header = (token: number, p: number, dd: number): ReactNode => (
    <span>
      {vocab[token]}
      <span style={{ color: color.text.secondary }}>{d > 1 ? ` d${dd}·pos${p}` : ` pos${p}`}</span>
    </span>
  );

  // rows are hidden units; each row heading shows its ∇z₁[j] (the shared factor).
  const rowHeadings = Array.from({ length: H }, (_, j) => (
    <StackedCell annotations={[`h${j}`]} main={<NumericCell value={dz1[j] ?? 0} signed />} />
  ));

  // cells[j][c] = W₁[slot][j] · ∇z₁[j], with W₁ as the small annotation so the
  // product reads as (∇z₁ from the row) × (W₁ annotation).
  const cells = Array.from({ length: H }, (_, j) =>
    slots.map(({ row }, c) => (
      <StackedCell
        annotations={[<NumericCell value={W1[row]?.[j] ?? 0} signed prefix="·" />]}
        main={<NumericCell value={products[c][j]} signed />}
      />
    )),
  );

  return (
    <Panel
      title={<SymbolTitle symbol="\Delta E = -\eta\,\nabla E" phase="worked out — this step" />}
      stage={TrainingStage.Update}
      step={step}
      dimmed={dimmed}
    >
      <Grid
        columnHeaders={slots.map(({ token, p, dd }) => header(token, p, dd))}
        rowHeadings={rowHeadings}
        cells={cells}
        cellStyle={(i, j) => ({ background: tint(products[j][i], j, i) })}
        rowHeadingStyle={() => ({ textAlign: 'right' })}
        columnHeaderStyle={() => ({ textAlign: 'right', color: color.text.primary })}
        rollups={[
          {
            label: <SymbolTitle symbol="\Sigma = \nabla E" />,
            cells: gradE.map((g) => <NumericCell value={g} signed />),
          },
          {
            label: <SymbolTitle symbol="\times(-\eta) = \Delta E" phase={`η=${lr.toFixed(2)}`} />,
            cells: slots.map(({ token, dd }) => (
              <NumericCell value={deltaE[token]?.[dd] ?? 0} signed prefix="Δ" colorFn={() => color.text.emphasis} />
            )),
          },
          {
            label: <SymbolTitle symbol="E" phase="before" />,
            cells: slots.map(({ token, dd }) => (
              <NumericCell value={E[token]?.[dd] ?? 0} signed colorFn={() => color.text.secondary} />
            )),
          },
          {
            label: <SymbolTitle symbol="E + \Delta E" phase="after" />,
            cells: slots.map(({ token, dd }) => <NumericCell value={Eafter[token]?.[dd] ?? 0} signed />),
          },
        ]}
      />
    </Panel>
  );
}
