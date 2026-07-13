import type { ReactNode } from 'react';

import { useW1AllWords } from '../../../theme';
import type { Matrix } from 'mlblocks/core';
import { StackedCell } from 'mlblocks';
import type { TrainingStage } from 'mlblocks';
import { MatrixPanel } from 'mlblocks';
import { paramTex } from 'mlblocks';
import { hiddenLabels, stillRandomInit, w1RowLabels, weightsPhase } from './mlpLabels';

interface W1MatrixProps {
  vocab: readonly string[];
  /** The N context token ids currently filling the slots. */
  context: number[];
  E: Matrix;
  W1: Matrix;
  step: number;
  dimmed: boolean;
  /** Injected by the flow's `panel(stage, …)` node. */
  stage?: TrainingStage;
}

/**
 * The W₁ weights panel, in one of two views (the "W₁ rows" view setting):
 *
 *  - **slots** (default): the raw (N·d)×H matrix — one row per positional input
 *    slot, annotated with the word currently filling it. This is the whole
 *    tensor; W₁ has no per-word rows.
 *  - **every word**: the derived push E[w]·W₁ per slot — for every vocab word
 *    in every context position, what it would add to each hidden unit if it
 *    sat there. (V rows per slot, the live context's rows highlighted — the
 *    slots view shows exactly those highlighted combinations.)
 */
export function W1Matrix({ vocab, context, E, W1, step, dimmed, stage }: W1MatrixProps) {
  const [w1AllWords] = useW1AllWords();
  const d = E[0]?.length ?? 0;
  const H = W1[0]?.length ?? 0;

  if (!w1AllWords) {
    return (
      <MatrixPanel
        symbol={paramTex('W1', 'W_1')}
        phase={weightsPhase('D×H', step)}
        stage={stage}
        step={step}
        dimmed={dimmed}
        randomInit={stillRandomInit(step)}
        matrix={W1}
        rowHeadings={w1RowLabels(vocab, context, d)}
        columnHeaders={hiddenLabels(H)}
        rowHeadingMinWidth="8ch"
      />
    );
  }

  // Every word in every slot: contribution[h] = Σⱼ E[w][j] · W₁[pos·d+j][h].
  const matrix: number[][] = [];
  const rowHeadings: ReactNode[] = [];
  const highlightedRows: number[] = [];
  context.forEach((liveId, pos) => {
    vocab.forEach((word, w) => {
      matrix.push(
        Array.from({ length: H }, (_, h) => {
          let sum = 0;
          for (let j = 0; j < d; j++) sum += (E[w]?.[j] ?? 0) * (W1[pos * d + j]?.[h] ?? 0);
          return sum;
        }),
      );
      rowHeadings.push(<StackedCell annotations={[`pos${pos}`]} main={word} />);
      if (w === liveId) highlightedRows.push(pos * vocab.length + w);
    });
  });

  return (
    <MatrixPanel
      symbol={`${paramTex('E', 'E')} \\cdot ${paramTex('W1', 'W_1')}`}
      phase={weightsPhase('(N·V)×H', step)}
      stage={stage}
      step={step}
      dimmed={dimmed}
      randomInit={stillRandomInit(step)}
      matrix={matrix}
      rowHeadings={rowHeadings}
      columnHeaders={hiddenLabels(H)}
      rowHeadingMinWidth="8ch"
      highlightedRows={highlightedRows}
    />
  );
}
