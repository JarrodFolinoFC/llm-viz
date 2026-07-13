import type { Meta, StoryObj } from '@storybook/react-vite';

import { Generation } from './index';

const vocab = ['the', 'cat', 'sat', 'on', 'mat', '.'];

// The greedy-decoded sequence of token ids.
const meta = {
  title: 'Stages/Inference/Generation',
  component: Generation,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    vocab: { control: false },
    seq: { control: false },
  },
  args: {
    vocab,
    seq: [0, 1, 2, 3, 4, 5],
  },
} satisfies Meta<typeof Generation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortSequence: Story = {
  args: { seq: [0, 1, 2] },
};
