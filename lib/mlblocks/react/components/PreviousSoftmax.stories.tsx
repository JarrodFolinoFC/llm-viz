import type { Meta, StoryObj } from '@storybook/react-vite';

import { PreviousSoftmax } from './PreviousSoftmax';

const vocab = ['the', 'cat', 'sat', '.'];
// A V×V weight matrix.
const matrix = vocab.map((_, i) => vocab.map((_, j) => (i - j) / vocab.length));

const meta = {
  title: 'Flow/PreviousSoftmax',
  component: PreviousSoftmax,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    phase: { control: 'text' },
    vocab: { control: false },
    matrix: { control: false },
    flash: { control: false },
  },
  args: {
    vocab,
    matrix,
    step: 5,
    flash: null,
  },
} satisfies Meta<typeof PreviousSoftmax>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A flashed (prev → target) pair highlights its row.
export const Flashed: Story = {
  args: { flash: { prev: 0, target: 2 } },
};
