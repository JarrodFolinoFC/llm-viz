import type { Meta, StoryObj } from '@storybook/react-vite';

import { MlpFlowContainer } from './MlpFlowContainer';
import { CORPUS_22 } from '../../../lib/corpora';

const VOCAB = [...new Set(CORPUS_22.split(' '))];

const meta = {
  title: 'Flows/MlpFlow',
  component: MlpFlowContainer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    corpus: { control: 'text' },
    dim: { control: { type: 'number', min: 1, max: 8 } },
    blockSize: { control: { type: 'number', min: 1, max: 5 } },
    hiddenSize: { control: { type: 'number', min: 2, max: 32 } },
  },
  args: {
    vocab: VOCAB,
    corpus: CORPUS_22,
    dim: 3,
    blockSize: 3,
    hiddenSize: 8,
  },
} satisfies Meta<typeof MlpFlowContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

// The full Bengio MLP flow: forward → softmax → backprop → update.
export const Default: Story = {};

// A wider context window (4 previous tokens) and a narrower embedding.
export const WideContext: Story = {
  args: { blockSize: 4, dim: 2 },
};

// A larger hidden layer.
export const BigHidden: Story = {
  args: { hiddenSize: 16 },
};
