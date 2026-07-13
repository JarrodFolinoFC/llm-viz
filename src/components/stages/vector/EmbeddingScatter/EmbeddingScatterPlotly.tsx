import { useMemo } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-gl3d-dist-min';
import type { Data, Layout } from 'plotly.js';

import { resolveThemeColors, useViewSettings } from '../../../../theme';
import type { EmbeddingFlash } from '../../../../training/strategies/embedding';

const Plot = createPlotlyComponent(Plotly);

interface EmbeddingScatterPlotlyProps {
  vocab: readonly string[];
  E: number[][];
  U: number[][];
  EBefore: number[][];
  flash: EmbeddingFlash | null;
  size: number;
}

const col = (M: number[][], k: number) => M.map((r) => r[k] ?? 0);

/**
 * Prototype 3-d scatter using Plotly's WebGL scatter3d — rotate/zoom/pan and
 * depth come for free. Same data as the hand-rolled SVG view: e_a points
 * (labelled) and u_b markers (hover), with the active step's nudge as a dotted
 * line. Compare against the SVG renderer via the toggle in EmbeddingScatter.
 */
export default function EmbeddingScatterPlotly({ vocab, E, U, EBefore, flash, size }: EmbeddingScatterPlotlyProps) {
  const { mode } = useViewSettings();
  // Plotly parses colors itself and can't read CSS `var(--c-…)` tokens, so we
  // resolve the active theme to concrete hex here.
  const c = useMemo(() => resolveThemeColors(mode), [mode]);
  const active = flash?.prev ?? null;
  const target = flash?.target ?? null;

  const data = useMemo<Data[]>(() => {
    const traces: Data[] = [
      {
        type: 'scatter3d',
        mode: 'markers',
        x: col(U, 0), y: col(U, 1), z: col(U, 2),
        text: vocab as string[],
        hoverinfo: 'text',
        name: 'u (next)',
        marker: {
          size: U.map((_, i) => (i === target ? 9 : 4)),
          color: c['highlight'],
          symbol: 'diamond',
        },
      },
      {
        type: 'scatter3d',
        mode: 'text+markers',
        x: col(E, 0), y: col(E, 1), z: col(E, 2),
        text: vocab as string[],
        textposition: 'top center',
        textfont: { size: 11 },
        hoverinfo: 'text',
        name: 'e (word)',
        marker: {
          size: E.map((_, i) => (i === active ? 9 : 5)),
          color: c['info-fg'],
          symbol: 'circle',
        },
      },
    ];
    if (active != null) {
      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: [EBefore[active][0], E[active][0]],
        y: [EBefore[active][1], E[active][1]],
        z: [EBefore[active][2] ?? 0, E[active][2] ?? 0],
        line: { color: c['text-muted'], width: 4, dash: 'dot' },
        hoverinfo: 'skip',
        showlegend: false,
      });
    }
    return traces;
  }, [E, U, EBefore, vocab, active, target, c]);

  const layout = useMemo<Partial<Layout>>(
    () => {
      const axis = {
        zeroline: true,
        gridcolor: c['border-default'],
        zerolinecolor: c['border-strong'],
        backgroundcolor: c['bg-page'],
        showbackground: true,
      };
      return {
        margin: { l: 0, r: 0, t: 0, b: 0 },
        showlegend: true,
        legend: { x: 0, y: 1 },
        paper_bgcolor: c['bg-page'],
        plot_bgcolor: c['bg-page'],
        font: { color: c['text-primary'] },
        scene: {
          aspectmode: 'data',
          xaxis: { title: { text: 'x' }, ...axis },
          yaxis: { title: { text: 'y' }, ...axis },
          zaxis: { title: { text: 'z' }, ...axis },
        },
      };
    },
    [c],
  );

  return (
    <Plot
      data={data}
      layout={{ ...layout, width: size, height: size }}
      config={{ displayModeBar: false }}
      style={{ width: size, height: size }}
    />
  );
}
