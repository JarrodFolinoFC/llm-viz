import type { Meta, StoryObj } from '@storybook/react-vite';

import { RowSoftmax } from './RowSoftmax';

const vocab = ['the', 'cat', 'sat', '.'];
const matrix = vocab.map((_, i) => vocab.map((_, j) => (i - j) / vocab.length));

const meta = {
  title: 'Flow/RowSoftmax',
  component: RowSoftmax,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    phase: { control: 'text' },
    logitLabel: { control: 'text' },
    vocab: { control: false },
    matrix: { control: false },
    flash: { control: false },
  },
  args: {
    vocab,
    matrix,
    step: 5,
    dimmed: false,
    flash: { prev: 0, target: 2, pairIdx: 0 },
  },
} satisfies Meta<typeof RowSoftmax>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
