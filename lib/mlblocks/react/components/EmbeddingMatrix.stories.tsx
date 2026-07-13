import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmbeddingMatrix } from './EmbeddingMatrix';
import { TrainingStage } from '../../core/stage';

const VOCAB = ['the', 'cat', 'sat', 'on', 'mat', 'hat'];

// A V×d embedding matrix (d = 3).
const E = [
  [0.21, -0.4, 0.11],
  [-0.7, 0.33, 0.05],
  [0.44, 0.08, -0.52],
  [-0.13, 0.6, 0.27],
  [0.36, -0.22, 0.49],
  [-0.05, -0.31, 0.18],
];

const meta = {
  title: 'Panels/EmbeddingMatrix',
  component: EmbeddingMatrix,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    symbol: { control: 'text' },
    phase: { control: 'text' },
    matrix: { control: 'object' },
    step: { control: { type: 'number', min: 0 } },
    highlightedRow: { control: { type: 'number', min: 0 } },
    highlightedRows: { control: 'object' },
    vocab: { control: false },
  },
  args: {
    vocab: VOCAB,
    matrix: E,
    symbol: 'E',
    stage: TrainingStage.Parameters,
    phase: 'embeddings',
    step: 5,
  },
} satisfies Meta<typeof EmbeddingMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

// Each row is one token's learned d-vector.
export const Default: Story = {};

// A single flash-highlighted token row (the vector flow's prev/target token).
export const SingleHighlight: Story = {
  args: { highlightedRow: 1 },
};

// Several rows highlighted at once — the MLP's N context tokens.
export const ContextRows: Story = {
  args: { highlightedRows: [0, 1, 4] },
};

// The gradient ∇E rendered in the same shell (mostly zero, touched rows nonzero).
export const Gradient: Story = {
  args: {
    symbol: '\\nabla E',
    phase: 'context rows',
    matrix: [
      [0, 0, 0],
      [0.12, -0.08, 0.03],
      [0, 0, 0],
      [0, 0, 0],
      [-0.21, 0.05, 0.14],
      [0, 0, 0],
    ],
    highlightedRows: [1, 4],
  },
};
