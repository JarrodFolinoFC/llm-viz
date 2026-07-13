import type { Meta, StoryObj } from '@storybook/react-vite';

import { maxAbs } from 'mlblocks/core';

import { WeightMatrix } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
const matrix = vocab.map((_, i) => vocab.map((_, j) => (i - j) / vocab.length));

// The bigram logit table W (V×V), one row of next-token logits per prev token.
const meta = {
  title: 'Stages/Bigram/WeightMatrix',
  component: WeightMatrix,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    vocab: { control: false },
    matrix: { control: false },
    domainMax: { control: false },
    flash: { control: false },
  },
  args: { vocab, matrix, domainMax: maxAbs(matrix), step: 5, flash: null },
} satisfies Meta<typeof WeightMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A flashed (prev → target) pair highlights its row + cell.
export const Flashed: Story = {
  args: { flash: { prev: 0, target: 2 } },
};
