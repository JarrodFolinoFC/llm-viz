import type { Meta, StoryObj } from '@storybook/react-vite';

import { Softmax } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
// [logit, eˣ, probability] per next token.
const logits = [0.2, 1.1, -0.4, 0.3];
const exps = logits.map((l) => Math.exp(l));
const sum = exps.reduce((a, b) => a + b, 0);
const matrix = vocab.map((_, i) => [logits[i], exps[i], exps[i] / sum]);

const meta = {
  title: 'Stages/Inference/Softmax',
  component: Softmax,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    predicted: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    logitLabel: { control: 'text' },
    vocab: { control: false },
    matrix: { control: false },
    subtitle: { control: false },
  },
  args: { vocab, matrix, current: 0, predicted: 1 },
} satisfies Meta<typeof Softmax>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLogitLabel: Story = {
  args: { logitLabel: 'x = h·W₂' },
};
