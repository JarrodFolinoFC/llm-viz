import type { Meta, StoryObj } from '@storybook/react-vite';

import { InferenceWeights } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
const matrix = vocab.map((_, i) => vocab.map((_, j) => (i - j) / vocab.length));

// W at inference: the current token's row is read, the predicted column highlighted.
const meta = {
  title: 'Stages/Inference/InferenceWeights',
  component: InferenceWeights,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    predicted: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    vocab: { control: false },
    matrix: { control: false },
  },
  args: { vocab, matrix, current: 0, predicted: 2 },
} satisfies Meta<typeof InferenceWeights>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
