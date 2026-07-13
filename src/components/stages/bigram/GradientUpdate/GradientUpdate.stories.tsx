import type { Meta, StoryObj } from '@storybook/react-vite';

import { GradientUpdate } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
// One row per vocab token: [p, y, p − y].
const matrix = vocab.map((_, i) => {
  const p = 0.1 + i / 10;
  const y = i === 2 ? 1 : 0;
  return [p, y, p - y];
});
// −η(p − y) per vocab token.
const updates = matrix.map(([, , g]) => -0.5 * g);

const meta = {
  title: 'Stages/Bigram/GradientUpdate',
  component: GradientUpdate,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    vocab: { control: false },
    matrix: { control: false },
    updates: { control: false },
    flash: { control: false },
  },
  args: {
    vocab,
    matrix,
    updates,
    step: 5,
    dimmed: false,
    flash: { prev: 0, target: 2, pairIdx: 0, prevRow: vocab.map((_, j) => (0 - j) / vocab.length) },
  },
} satisfies Meta<typeof GradientUpdate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dimmed: Story = {
  args: { step: 0, dimmed: true, flash: null },
};
