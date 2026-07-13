import { maxAbs } from '../../core/math/funcs';
import { TrainingStage } from '../../core/stage';
import { useP } from '../primitives/context';
import { signColor } from '../flow/signedCell';
import { NumericCell } from './NumericCell';
import { Panel } from './Panel';
import { SymbolTitle } from './SymbolTitle';

interface DialsNoteProps {
  /** LaTeX symbol for the title, e.g. "W_1". */
  symbol: string;
  stage?: TrainingStage;
  step: number;
  dimmed?: boolean;
  /** A grid of dials (a weight matrix) — mutually exclusive with `vector`. */
  matrix?: number[][];
  /** A row of gauges (a bias / d=1 embedding vector). */
  vector?: number[];
  rowLabels?: string[];
  colLabels?: string[];
}

/** A dial plus its numeric readout (precision from the settings, like every
 *  other panel). Fixed dial width keeps grid columns visually aligned. */
function DialCell({ value, scale, size }: { value: number; scale: number; size?: number }) {
  const P = useP();
  return (
    <P.View inline direction="col" align="center" gap={1}>
      <P.Dial value={value} scale={scale} size={size} />
      <NumericCell value={value} signed colorFn={(v) => signColor(v)} />
    </P.View>
  );
}

/**
 * A companion that renders a panel's weights/biases as live needle dials — a
 * matrix becomes a grid of dials, a vector a row of gauges. Styled as a normal
 * training {@link Panel} (badge, action menu, theme colours) and shown only
 * when the "Dials" view setting is on.
 */
export function DialsNote({ symbol, stage, step, dimmed = false, matrix, vector, rowLabels, colLabels }: DialsNoteProps) {
  const P = useP();
  const scale = matrix ? maxAbs(matrix.length ? matrix : [[0]]) : maxAbs([vector ?? [0]]);
  const dialSize = matrix ? 30 : 38;

  return (
    <Panel title={<SymbolTitle symbol={symbol} phase="dials" />} stage={stage} step={step} dimmed={dimmed}>
      {matrix ? (
        <P.View direction="col" gap={2}>
          <P.View gap={6} align="end">
            <P.Text sty={{ font: 'sm' }}> </P.Text>
            {(colLabels ?? matrix[0]?.map((_, j) => `${j}`) ?? []).map((c, j) => (
              <P.Text key={j} sty={{ font: 'sm', color: 'textSecondary', nowrap: true, wch: 5, align: 'center' }}>
                {c}
              </P.Text>
            ))}
          </P.View>
          {matrix.map((row, i) => (
            <P.View key={i} gap={6} align="end">
              <P.Text sty={{ font: 'sm', color: 'textSecondary', nowrap: true }}>{rowLabels?.[i] ?? i}</P.Text>
              {row.map((v, j) => (
                <DialCell key={`${i}-${j}`} value={v} scale={scale} size={dialSize} />
              ))}
            </P.View>
          ))}
        </P.View>
      ) : (
        <P.View wrap gap={10}>
          {(vector ?? []).map((v, i) => (
            <P.View key={i} direction="col" align="center" gap={1}>
              <DialCell value={v} scale={scale} size={dialSize} />
              <P.Text sty={{ font: 'sm', color: 'textSecondary' }}>{rowLabels?.[i] ?? i}</P.Text>
            </P.View>
          ))}
        </P.View>
      )}
    </Panel>
  );
}
