import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmbeddingTable } from './index';

const vocab = ['the', 'cat', 'sat', 'on', '.'];
// A V×d embedding matrix.
const matrix = vocab.map((_, i) => [Math.sin(i) / 2, Math.cos(i) / 2]);

const meta = {
  title: 'Stages/Inference/EmbeddingTable',
  component: EmbeddingTable,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: { control: 'text' },
    highlightRow: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    vocab: { control: false },
    matrix: { control: false },
  },
  args: {
    title: 'Token embeddings E',
    vocab,
    matrix,
    highlightRow: null,
  },
} satisfies Meta<typeof EmbeddingTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// `highlightRow` marks the current token's vector.
export const HighlightedRow: Story = {
  args: { highlightRow: 1 },
};
