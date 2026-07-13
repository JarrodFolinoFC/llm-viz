import type { Meta, StoryObj } from '@storybook/react-vite';

import { GradientColumn } from './GradientColumn';

const vocab = ['the', 'cat', 'sat', '.'];
const matrix = vocab.map((_, i) => vocab.map((_, j) => Math.sin(i + j) / 4));

const meta = {
  title: 'Flow/GradientColumn',
  component: GradientColumn,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    phase: { control: 'text' },
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
} satisfies Meta<typeof GradientColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dimmed: Story = {
  args: { step: 0, dimmed: true, flash: null },
};
