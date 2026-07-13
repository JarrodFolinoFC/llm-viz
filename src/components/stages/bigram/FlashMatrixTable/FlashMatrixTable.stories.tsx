import type { Meta, StoryObj } from '@storybook/react-vite';

import { maxAbs } from 'mlblocks/core';

import { FlashMatrixTable } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
const matrix = vocab.map((_, i) => vocab.map((_, j) => (i - j) / vocab.length));

// W with the just-updated row flashed and the per-column Δ shown.
const meta = {
  title: 'Stages/Bigram/FlashMatrixTable',
  component: FlashMatrixTable,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    vocab: { control: false },
    matrix: { control: false },
    domainMax: { control: false },
    flash: { control: false },
    flashDeltas: { control: false },
  },
  args: { vocab, matrix, domainMax: maxAbs(matrix), step: 5, flash: null, flashDeltas: null },
} satisfies Meta<typeof FlashMatrixTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// No flash — a plain heatmap of W.
export const Default: Story = {};

// The trained row (prev = "the") flashes with its per-column update Δ.
export const Flashed: Story = {
  args: {
    flash: { prev: 0, target: 2, pairIdx: 0, prevRow: matrix[0].map((v) => v - 0.05) },
    flashDeltas: vocab.map((_, j) => (j === 2 ? 0.08 : -0.02)),
  },
};
