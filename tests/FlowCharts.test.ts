import { describe, it, expect } from 'vitest';
import mermaid from 'mermaid';

import { buildMlpFlowChart } from '../src/components/stages/mlp/mlpFlowChart';
import { buildBigramFlowChart } from '../src/components/stages/bigram/bigramFlowChart';
import { buildRnnFlowChart } from '../src/components/stages/rnn/rnnFlowChart';
import { assembleFlowChart } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import type { MlpFlowView } from '../src/components/stages/mlp/MlpFlowContainer';
import type { BigramViewModel } from '../src/components/stages/bigram/BigramViewModel';
import type { RnnFlowView } from '../src/components/stages/rnn/RnnFlowContainer';

const vocab = ['a', 'b', 'c'];
const softmaxRows = [
  [0, 0, 0.2],
  [0, 0, 0.3],
  [0, 0, 0.5],
];
const gradientRows = [
  [0.2, 0, 0.2],
  [0.3, 0, 0.3],
  [0.5, 1, -0.5],
];

const mlpView = {
  vocab,
  context: [0, 1],
  target: 2,
  E: [[0, 0], [0, 0], [0, 0]], // 3×2 → d = 2
  W1: Array.from({ length: 4 }, () => [0, 0, 0]), // D=4 × H=3
  W2: Array.from({ length: 3 }, () => [0, 0, 0]),
  hidden: [0.11, -0.22, 0.33],
  softmaxRows,
  gradientRows,
  lr: 0.3,
  step: 5,
} as unknown as MlpFlowView;

const bigramView = {
  vocab,
  currentPair: { prev: 0, target: 2 },
  softmaxRows,
  gradientRows,
  updateRows: [
    [0.2, -0.06],
    [0.3, -0.09],
    [-0.5, 0.15],
  ],
  step: 5,
} as unknown as BigramViewModel;

const rnnView = {
  vocab,
  context: [0, 1, 2],
  target: 2,
  E: [[0], [0], [0]], // 3×1 → d = 1
  bh: [0, 0, 0, 0], // H = 4
  hiddens: [Array(4).fill(0), Array(4).fill(0), Array(4).fill(0)],
  hN: [0.11, -0.22, 0.33, 0.05],
  Wxh: [Array(4).fill(0)],
  Whh: Array.from({ length: 4 }, () => Array(4).fill(0)),
  Why: Array.from({ length: 4 }, () => [0, 0, 0]),
  softmaxRows,
  gradientRows,
  lr: 0.3,
  step: 5,
} as unknown as RnnFlowView;

describe('buildMlpFlowChart', () => {
  it('embeds the live MLP forward/backward values across all stages', () => {
    const chart = buildMlpFlowChart(mlpView, new Set(), 2);
    expect(chart).toContain('context: a · b');
    expect(chart).toContain('target: c');
    expect(chart).toContain('h = tanh(x·W₁+b₁)');
    expect(chart).toContain('0.11, -0.22, 0.33'); // the hidden vector
    expect(chart).toContain('prediction: c ✓');
    expect(chart).toContain('∂L/∂logits = p − y');
    // the update flows back into the weights (dashed feedback edges)
    expect(chart).toContain('upd -.->|new W₁| w1');
    expect(chart).toContain('upd -.->|new E| emb');
    // every stage is colour-coded
    expect(chart).toContain('style s_data stroke:#FF8C00');
    expect(chart).toContain('style s_backprop stroke:#CD7F32');
    expect(chart).toContain('style s_update stroke:#FFBF00');
  });

  it('drops the Backprop + Update stages when hidden, with no dangling feedback', () => {
    const chart = buildMlpFlowChart(mlpView, new Set([TrainingStage.Backprop, TrainingStage.Update]), 2);
    expect(chart).not.toContain('s_backprop');
    expect(chart).not.toContain('s_update');
    expect(chart).not.toContain('prob --> grad'); // dangling edge removed
    expect(chart).not.toContain('-.->'); // the update feedback edges are gone too
    expect(chart).toContain('s_forward'); // forward still there
  });
});

describe('assembleFlowChart edge labels', () => {
  it('strips brackets from edge labels (they would be read as node shapes)', () => {
    const chart = assembleFlowChart(
      [
        { id: 'a', stage: TrainingStage.Data, title: 'A' },
        { id: 'b', stage: TrainingStage.Forward, title: 'B' },
      ],
      [{ from: 'a', to: 'b', label: 'row W[prev]' }],
      new Set(),
    );
    const edgeLine = chart.split('\n').find((l) => l.includes('-->'))!;
    expect(edgeLine).not.toMatch(/[[\]]/);
    expect(edgeLine).toContain('row Wprev');
  });
});

describe('buildBigramFlowChart', () => {
  it('embeds the live bigram values across all stages', () => {
    const chart = buildBigramFlowChart(bigramView, new Set(), 2);
    expect(chart).toContain('prev: a');
    expect(chart).toContain('target: c');
    expect(chart).toContain('P = softmax(W[prev])');
    expect(chart).toContain('prediction: c ✓');
    expect(chart).toContain('W[prev] ← W[prev] − η·grad');
    expect(chart).toContain('upd -.->|new W| w'); // update flows back into the table
    expect(chart).toContain('style s_weights stroke:#4169E1');
  });
});

describe('buildRnnFlowChart', () => {
  it('embeds the live RNN values and shows the recurrence self-loop', () => {
    const chart = buildRnnFlowChart(rnnView, new Set(), 2);
    expect(chart).toContain('context: a · b · c');
    expect(chart).toContain('0.11, -0.22, 0.33, 0.05'); // the final hidden state h_N
    expect(chart).toContain('prediction: c ✓');
    expect(chart).toContain('hid -.->'); // the recurrence loops the hidden state back on itself
    expect(chart).toContain('upd -.->|new W_hh| whh'); // recurrent weights get updated
  });
});

// Guards against malformed mermaid (e.g. unescaped parens/brackets in edge
// labels, which the parser reads as node-shape syntax). mermaid.parse throws on
// any syntax error, so every page's overview chart must round-trip cleanly.
describe('every flow chart is valid mermaid', () => {
  const charts: Record<string, string> = {
    mlp: buildMlpFlowChart(mlpView, new Set(), 2),
    bigram: buildBigramFlowChart(bigramView, new Set(), 2),
    rnn: buildRnnFlowChart(rnnView, new Set(), 2),
  };
  for (const [name, chart] of Object.entries(charts)) {
    it(`parses the ${name} chart`, async () => {
      await expect(mermaid.parse(chart)).resolves.toBeTruthy();
    });
  }
});
