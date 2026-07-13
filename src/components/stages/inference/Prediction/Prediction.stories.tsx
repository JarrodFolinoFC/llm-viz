import type { Meta, StoryObj } from '@storybook/react-vite';

import { Prediction } from './index';

const vocab = ['the', 'cat', 'sat', '.'];

// The final readout: current token → predicted next token (with its probability).
const meta = {
  title: 'Stages/Inference/Prediction',
  component: Prediction,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    predicted: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    prob: { control: { type: 'number', min: 0, max: 1, step: 0.01 } },
    vocab: { control: false },
  },
  args: { vocab, current: 0, predicted: 1, prob: 0.62 },
} satisfies Meta<typeof Prediction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LowConfidence: Story = {
  args: { prob: 0.28 },
};
