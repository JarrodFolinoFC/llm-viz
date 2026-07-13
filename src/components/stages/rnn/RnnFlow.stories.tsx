import type { Meta, StoryObj } from '@storybook/react-vite';

import { RnnFlowContainer } from './RnnFlowContainer';
import { CORPUS_22 } from '../../../lib/corpora';

const VOCAB = [...new Set(CORPUS_22.split(' '))];

const meta = {
  title: 'Flows/RnnFlow',
  component: RnnFlowContainer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    corpus: { control: 'text' },
    dim: { control: { type: 'number', min: 1, max: 8 } },
    blockSize: { control: { type: 'number', min: 1, max: 6 } },
    hiddenSize: { control: { type: 'number', min: 2, max: 32 } },
  },
  args: {
    vocab: VOCAB,
    corpus: CORPUS_22,
    dim: 1,
    blockSize: 3,
    hiddenSize: 6,
  },
} satisfies Meta<typeof RnnFlowContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

// The full Elman RNN flow: recurrence → read-out → backprop-through-time → update.
export const Default: Story = {};

// A longer context window (4 steps unrolled) — more BPTT to walk back.
export const LongerContext: Story = {
  args: { blockSize: 4 },
};

// A wider hidden state.
export const BigHidden: Story = {
  args: { hiddenSize: 12 },
};

// A 2-d embedding (the recurrence still reads one token per step).
export const VectorEmbedding: Story = {
  args: { dim: 2 },
};
