import { useState, type ReactNode } from 'react';

import { useP } from '../primitives/context';

import { cssVar } from '../lib/cssVars';
import { signedColormap } from '../../core/colormaps';
import { maxAbs } from '../../core/math/funcs';
import { Grid } from './Grid';
import { StackedCell } from './StackedCell';
import { NumericCell } from './NumericCell';
import { TrainingStage } from '../../core/stage';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';
import { TokenChip } from './TokenChip';
import { paramMeta, paramTex } from '../flow/paramTensor';
import { signColor } from '../flow/signedCell';

/** One input slot: which context token it came from and which embedding
 *  component (0…d−1) of that token, so the row heading can chip the token. */
export interface InputSlot {
  token: string;
  comp: number;
}

function EMark() {
  const P = useP();
  return <P.Text sty={{ color: { raw: paramMeta('E').color } }}>E</P.Text>;
}

/** The flat `E[token][comp]` string form of a slot — used in the modal headings. */
const slotLabel = ({ token, comp }: InputSlot) => `E[${token}][${comp}]`;

interface HiddenPreActivationProps {
  /** Per-input-slot descriptor, length D — the concatenated context embedding slots. */
  slots: InputSlot[];
  /** Positional label per slot (e.g. "pos1·d1"), matching W₁'s row headings. */
  posLabels: string[];
  /** The D concatenated context embeddings (the input vector x). */
  x: number[];
  /** D × H hidden weights. */
  W1: number[][];
  /** H bias terms b₁. */
  b1: number[];
  /** H pre-activations z₁ = x·W₁ + b₁. */
  z1: number[];
  /** H activations h = tanh(z₁). */
  hidden: number[];
  step: number;
  dimmed?: boolean;
}

/** Which working-out modal is open — a single cell, a whole input row, a hidden
 *  unit's affine+squash, or none. One union (not three nullable states), so at
 *  most one can open at a time. */
type OpenDetail =
  | { kind: 'cell'; k: number; j: number }
  | { kind: 'row'; k: number }
  | { kind: 'unit'; j: number }
  | null;

/** A cell/heading that opens its working-out modal on click. */
function Clickable({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const P = useP();
  return (
    <P.Pressable onPress={onClick} sty={{ radius: 'sm' }}>
      {children}
    </P.Pressable>
  );
}

/** A worked-calculation footer line: label left, headline value right. */
function WorkingFooter({ label, children }: { label: ReactNode; children: ReactNode }) {
  const P = useP();
  return (
    <P.View align="baseline" justify="between" gap="md" sty={{ py: 'sm', borderColor: 'border' }}>
      <P.Text color="textSecondary">{label}</P.Text>
      <P.Text sty={{ bold: true }}>{children}</P.Text>
    </P.View>
  );
}

/**
 * The whole hidden computation in one table: cell [k][j] is the product
 * x[k]·W₁[k][j], and the stacked rollups carry each unit's column down through
 * Σ = x·W₁ (the pre-bias dot product), the bias b₁, the pre-activation
 * z₁ = x·W₁ + b₁, and finally the activation h = tanh(z₁). Row headings carry
 * the input value x[k] so each cell reads as x[k] × W₁[k][j]; the columns are
 * the hidden units, so a unit's whole story is one column.
 *
 * Clicking a cell opens the working for that one product; clicking a row heading
 * opens the working for every unit that input slot feeds; clicking a unit's h
 * rollup cell opens its affine + tanh squash (x·W₁ + b₁ → tanh → h).
 */
export function HiddenPreActivation({
  slots,
  posLabels,
  x,
  W1,
  b1,
  z1,
  hidden,
  step,
  dimmed = false,
}: HiddenPreActivationProps) {
  const P = useP();
  // The optional detail-dialog slot, hoisted to a capitalised local so TS can
  // narrow it; without one the workings simply don't open (native v1).
  const DetailModal = P.Modal;
  const units = W1[0]?.length ?? 0;
  const products = W1.map((row, k) => row.map((w) => x[k] * w));
  const sums = Array.from({ length: units }, (_, j) => products.reduce((acc, row) => acc + row[j], 0));
  const tint = signedColormap(maxAbs(products.length ? products : [[0]]));

  const [open, setOpen] = useState<OpenDetail>(null);
  const openCell = open?.kind === 'cell' ? open : null;
  const openRow = open?.kind === 'row' ? open.k : null;
  const openUnit = open?.kind === 'unit' ? open.j : null;

  return (
    <Panel
      title={<SymbolTitle symbol="x \odot W_1" phase="per-unit products → h" />}
      stage={TrainingStage.Forward}
      step={step}
      dimmed={dimmed}
    >
      <Grid
        columnHeaders={Array.from({ length: units }, (_, j) => j)}
        rowHeadings={slots.map((slot, k) => (
          <Clickable onClick={() => setOpen({ kind: 'row', k })}>
            {/* The heading value is the embedding lookup E[token][comp] — label
                it with an E (in E's identity colour) so its origin is explicit. */}
            <StackedCell
              annotations={[
                <EMark />,
                <TokenChip text={slot.token} isPrev />,
                `[${slot.comp}]`,
              ]}
              main={<NumericCell value={x[k]} signed />}
            />
          </Clickable>
        ))}
        cells={products.map((row, k) =>
          row.map((p, j) => (
            // The working out: the row heading carries x[k], the small ·W₁
            // annotation the weight, so the cell reads x[k] × W₁[k][j] = product.
            <Clickable onClick={() => setOpen({ kind: 'cell', k, j })}>
              <StackedCell
                annotations={[<NumericCell value={W1[k][j]} signed prefix="·" colorFn={() => cssVar.textSecondary} />]}
                main={<NumericCell value={p} signed />}
              />
            </Clickable>
          )),
        )}
        cellStyle={(i, j) => ({ background: tint(products[i][j], i, j) })}
        rowHeadingStyle={() => ({ textAlign: 'right' })}
        columnHeaderStyle={() => ({ textAlign: 'right', color: cssVar.textSecondary })}
        rollups={[
          {
            label: <SymbolTitle symbol="\Sigma = x \cdot W_1" />,
            cells: sums.map((s) => <NumericCell value={s} signed />),
          },
          {
            // b₁ carries its parameter identity colour (the teal the filter and
            // the b₁ panel use).
            label: <SymbolTitle symbol={paramTex('b1', 'b_1')} />,
            cells: b1.map((b, j) => (
              <NumericCell key={j} value={b} signed colorFn={() => paramMeta('b1').color} />
            )),
          },
          {
            label: <SymbolTitle symbol="z_1 = x \cdot W_1 + b_1" />,
            cells: z1.map((z) => <NumericCell value={z} signed />),
          },
          {
            // The activation — clickable, so each unit opens its affine + squash.
            label: <SymbolTitle symbol="h = \tanh(z_1)" />,
            cells: hidden.map((h, j) => (
              <Clickable onClick={() => setOpen({ kind: 'unit', j })}>
                <NumericCell value={h} signed />
              </Clickable>
            )),
          },
        ]}
      />

      {/* One product: x[k] · W₁[k][j]. */}
      {DetailModal && (
      <DetailModal
        open={openCell != null}
        onClose={() => setOpen(null)}
        title={openCell ? `unit ${openCell.j} ◂ ${slotLabel(slots[openCell.k])}` : ''}
      >
        {openCell && (
          <P.View direction="col" gap="md">
            <Grid
              columnHeaders={[slotLabel(slots[openCell.k]), `W₁[${posLabels[openCell.k]}][${openCell.j}]`, 'product']}
              rowHeadings={['']}
              cells={[[
                <NumericCell value={x[openCell.k]} signed colorFn={() => cssVar.textSecondary} />,
                <NumericCell value={W1[openCell.k][openCell.j]} signed colorFn={() => cssVar.textSecondary} />,
                <NumericCell value={products[openCell.k][openCell.j]} signed colorFn={() => signColor(products[openCell.k][openCell.j])} />,
              ]]}
              columnHeaderStyle={() => ({ textAlign: 'center', color: cssVar.textPrimary })}
            />
            <WorkingFooter label={<>{slotLabel(slots[openCell.k])} · W₁[{posLabels[openCell.k]}][{openCell.j}]</>}>
              <NumericCell value={products[openCell.k][openCell.j]} signed colorFn={(v) => signColor(v)} />
            </WorkingFooter>
          </P.View>
        )}
      </DetailModal>
      )}

      {/* One input slot's contribution to every unit. */}
      {DetailModal && (
      <DetailModal
        open={openRow != null}
        onClose={() => setOpen(null)}
        title={
          openRow != null
            ? `${slotLabel(slots[openRow])} — contributions to all ${units} units`
            : ''
        }
      >
        {openRow != null && (
          <P.View direction="col" gap="md">
            <WorkingFooter label={<>{slotLabel(slots[openRow])}</>}>
              <NumericCell value={x[openRow]} signed colorFn={() => cssVar.textSecondary} />
            </WorkingFooter>
            <Grid
              columnHeaders={[slotLabel(slots[openRow]), `W₁[${posLabels[openRow]}][·]`, 'x·W₁']}
              rowHeadings={Array.from({ length: units }, (_, j) => `h${j}`)}
              cells={Array.from({ length: units }, (_, j) => [
                <NumericCell value={x[openRow]} signed colorFn={() => cssVar.textSecondary} />,
                <NumericCell value={W1[openRow][j]} signed colorFn={() => cssVar.textSecondary} />,
                <NumericCell value={products[openRow][j]} signed colorFn={() => signColor(products[openRow][j])} />,
              ])}
              columnHeaderStyle={() => ({ textAlign: 'center', color: cssVar.textPrimary })}
              rowHeadingStyle={() => ({ textAlign: 'right' })}
            />
          </P.View>
        )}
      </DetailModal>
      )}

      {/* One unit's affine + squash: x·W₁ + b₁ = z₁, then tanh(z₁) = h. The
          per-slot x·W₁ breakdown is the grid above (this unit's column). */}
      {DetailModal && (
      <DetailModal
        open={openUnit != null}
        onClose={() => setOpen(null)}
        title={openUnit != null ? `unit h${openUnit}` : ''}
      >
        {openUnit != null && (
          <P.View direction="col" gap="md">
            <Grid
              columnHeaders={['x·W₁', 'b₁', 'z₁ = x·W₁+b₁']}
              rowHeadings={['']}
              cells={[[
                <NumericCell value={sums[openUnit]} signed colorFn={() => cssVar.textSecondary} />,
                <NumericCell value={b1[openUnit]} signed colorFn={() => cssVar.textSecondary} />,
                <NumericCell value={z1[openUnit]} signed colorFn={() => signColor(z1[openUnit])} />,
              ]]}
              columnHeaderStyle={() => ({ textAlign: 'center', color: cssVar.textPrimary })}
            />
            <WorkingFooter label="h = tanh(z₁)">
              <NumericCell value={hidden[openUnit]} signed colorFn={(v) => signColor(v)} />
            </WorkingFooter>
          </P.View>
        )}
      </DetailModal>
      )}
    </Panel>
  );
}
