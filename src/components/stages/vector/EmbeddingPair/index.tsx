import type { ReactNode } from 'react';
import { color, useViewSettings } from '../../../../theme';
import { signColor, signArrow } from 'mlblocks';
import { FormulaDisplay } from 'mlblocks';
import { Grid, VectorCell } from 'mlblocks';
import { Panel, TrainingStage } from 'mlblocks';
import titleStyles from '../../../core/panelTitles.module.css';
import { PhaseTag } from 'mlblocks';
import textStyles from '../../../core/panelText.module.css';

interface EmbeddingPairProps {
  vocab: readonly string[];
  /** V × d embedding matrix (prev-token vectors). */
  E: number[][];
  /** V × d unembedding matrix (next-token vectors). */
  U: number[][];
  /** Training step these weights belong to (shown in the title + badge). */
  step: number;
  /** Active prev token — its e row/cell is flash-highlighted. */
  prevRow?: number | null;
  /** Active target token — its u row/cell is flash-highlighted. */
  targetRow?: number | null;
  /** Muted suffix marking which step's state this is, e.g. "(previous step)". */
  phase?: string;
  /** Pre-update weights. When given, each component shows its Δ (E − EBefore)
   *  stacked on top of the new value — the "after update" view. */
  EBefore?: number[][];
  UBefore?: number[][];
}

/**
 * E and U in one table, rows aligned by token: each row shows the token's
 * embedding e (prev vector) beside its unembedding u (next vector). The active
 * pair's e (prev) and u (target) cells are flash-highlighted.
 */
export function EmbeddingPair({ vocab, E, U, step, prevRow, targetRow, phase, EBefore, UBefore }: EmbeddingPairProps) {
  const { precision } = useViewSettings();
  // Changes below this round to "0.00", so we leave them un-annotated.
  const DELTA_EPS = 0.5 * 10 ** -precision;
  // The prev token ("a", the e vector) flashes amber; the target token
  // ("b", the u vector) flashes blue — matching the dot-product convention.
  const prevHead = { background: color.chip.prevBg, color: color.chip.prevFg, fontWeight: 'bold' as const };
  const targetHead = { background: color.chip.nextBg, color: color.chip.nextFg, fontWeight: 'bold' as const };

  // The "after update" view stacks each component's Δ (new − old) on top of it.
  const deltaAnnotations = (now: number[], before?: number[]): (ReactNode | null)[] | undefined => {
    if (!before) return undefined;
    return now.map((v, k) => {
      const delta = v - (before[k] ?? v);
      return Math.abs(delta) >= DELTA_EPS ? (
        <span style={{ color: signColor(delta) }}>
          {signArrow(delta)}&nbsp;{Math.abs(delta).toFixed(precision)}
        </span>
      ) : null;
    });
  };

  // Does this row move at all this step (any e or u component past DELTA_EPS)?
  const moved = (now: number[], before?: number[]) =>
    !!before && now.some((v, k) => Math.abs(v - (before[k] ?? v)) >= DELTA_EPS);

  // In the "after update" view (EBefore/UBefore given) one step only moves the
  // prev token's e and the u rows whose gradient is large enough to register; the
  // rest round to 0.00. Hide those untouched rows so the panel shows just what
  // changed. The active pair is always kept so its highlight never disappears.
  // With pre-update weights to diff against this is the post-step "after update"
  // view; otherwise it's just the current weight table.
  const showDeltas = !!(EBefore && UBefore);
  const stage = showDeltas ? TrainingStage.Update : TrainingStage.Parameters;
  const visibleRows = E.map((_, i) => i).filter(
    (i) =>
      !showDeltas ||
      i === prevRow ||
      i === targetRow ||
      moved(E[i], EBefore?.[i]) ||
      moved(U[i] ?? [], UBefore?.[i]),
  );
  const hiddenCount = E.length - visibleRows.length;

  const title = (
    <span className={titleStyles.title}>
      <FormulaDisplay inline latex={'E,\\; U'} />
      <PhaseTag phase={phase} />
    </span>
  );

  return (
    <Panel
      title={title}
      stage={stage}
      step={step}
      dimmed={false}
    >
      <Grid
        columnHeaders={['e', 'u']}
        rowHeadings={visibleRows.map((i) => vocab[i])}
        cells={visibleRows.map((i) => [
          <VectorCell values={E[i]} signed annotations={deltaAnnotations(E[i], EBefore?.[i])} />,
          <VectorCell values={U[i] ?? []} signed annotations={deltaAnnotations(U[i] ?? [], UBefore?.[i])} />,
        ])}
        columnHeaderStyle={() => ({ textAlign: 'center', color: color.text.primary })}
        // Flash the active pair's own cells: the prev token's e (col 0) amber,
        // the target token's u (col 1) blue — matching the row-heading colours.
        // `pos` indexes the (possibly filtered) visible rows; map it back to the
        // token's original row before comparing to prevRow/targetRow.
        cellStyle={(pos, j) => {
          const i = visibleRows[pos];
          return i === prevRow && j === 0
            ? { background: color.chip.prevBg }
            : i === targetRow && j === 1
              ? { background: color.chip.nextBg }
              : undefined;
        }}
        rowHeadingStyle={(pos) => {
          const i = visibleRows[pos];
          return {
            textAlign: 'right',
            ...(i === prevRow ? prevHead : i === targetRow ? targetHead : undefined),
          };
        }}
      />
      {hiddenCount > 0 && (
        <div className={textStyles.hintCaption}>
          {hiddenCount} unchanged {hiddenCount === 1 ? 'token' : 'tokens'} hidden
        </div>
      )}
    </Panel>
  );
}
