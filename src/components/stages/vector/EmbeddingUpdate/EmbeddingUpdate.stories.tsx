import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmbeddingUpdate } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
const U = vocab.map((_, i) => [Math.cos(i) / 2, Math.sin(i) / 2]);

// The SGD nudge to e_a: e_a ← e_a − lr · ∂L/∂e_a. With flash = null it renders
// the static shell (the live gradient arrives via the EmbeddingFlash at runtime).
const meta = {
  title: 'Stages/Vector/EmbeddingUpdate',
  component: EmbeddingUpdate,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    lr: { control: { type: 'number', min: 0, step: 0.05 } },
    phase: { control: 'text' },
    vocab: { control: false },
    flash: { control: false },
    U: { control: false },
  },
  args: { vocab, step: 5, dimmed: false, lr: 0.5, flash: null, U },
} satisfies Meta<typeof EmbeddingUpdate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dimmed: Story = {
  args: { step: 0, dimmed: true },
};
