import type { Meta, StoryObj } from '@storybook/react-vite';

import { MatrixPanel } from './MatrixPanel';
import { TrainingStage } from '../../core/stage';

// A small D×H weight matrix.
const W1 = [
  [0.31, -0.42, 0.18, 0.07],
  [-0.22, 0.55, -0.13, 0.4],
  [0.09, 0.27, -0.61, -0.05],
  [0.48, -0.16, 0.33, 0.21],
  [-0.37, 0.04, 0.12, -0.5],
  [0.15, -0.29, 0.44, 0.08],
];

const DELTAS = W1.map((row) => row.map((v) => -0.05 * Math.sign(v)));

const meta = {
  title: 'Panels/MatrixPanel',
  component: MatrixPanel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    symbol: { control: 'text' },
    phase: { control: 'text' },
    matrix: { control: 'object' },
    deltas: { control: 'object' },
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    rowHeadings: { control: false },
    columnHeaders: { control: false },
  },
  args: {
    symbol: 'W_1',
    phase: 'D×H',
    stage: TrainingStage.Parameters,
    matrix: W1,
    step: 5,
    dimmed: false,
  },
} satisfies Meta<typeof MatrixPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// A weight matrix as a signed heatmap of numeric cells.
export const Weights: Story = {};

// The same shell rendering a gradient (∇W₁) instead of the weights.
export const Gradient: Story = {
  args: {
    symbol: '\\nabla W_1',
    matrix: DELTAS.map((row) => row.map((v) => v * 6)),
  },
};

// The update view: post-update weights with the per-cell Δ stacked above.
export const WithDeltas: Story = {
  args: {
    symbol: 'W_1',
    phase: 'after step',
    matrix: W1.map((row, i) => row.map((v, j) => v + DELTAS[i][j])),
    deltas: DELTAS,
  },
};

// Explicit row/column labels.
export const Labeled: Story = {
  args: {
    rowHeadings: ['x₀', 'x₁', 'x₂', 'x₃', 'x₄', 'x₅'],
    columnHeaders: ['h₀', 'h₁', 'h₂', 'h₃'],
  },
};

export const Dimmed: Story = {
  args: { step: 0, dimmed: true },
};
