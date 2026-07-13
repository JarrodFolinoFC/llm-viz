import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmbeddingPair } from './index';

const vocab = ['the', 'cat', 'sat', '.'];
const E = vocab.map((_, i) => [Math.sin(i) / 2, Math.cos(i) / 2]);
const U = vocab.map((_, i) => [Math.cos(i) / 2, Math.sin(i) / 2]);

// The prev-token (E) and next-token (U) embedding matrices side by side.
const meta = {
  title: 'Stages/Vector/EmbeddingPair',
  component: EmbeddingPair,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    prevRow: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    targetRow: { control: { type: 'number', min: 0, max: vocab.length - 1 } },
    phase: { control: 'text' },
    vocab: { control: false },
    E: { control: false },
    U: { control: false },
    EBefore: { control: false },
    UBefore: { control: false },
  },
  args: { vocab, E, U, step: 5, prevRow: 0, targetRow: 2 },
} satisfies Meta<typeof EmbeddingPair>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// With pre-update weights, each cell stacks its Δ (the "after update" view).
export const WithDeltas: Story = {
  args: {
    phase: 'after step',
    EBefore: E.map((r) => r.map((v) => v - 0.04)),
    UBefore: U.map((r) => r.map((v) => v + 0.03)),
  },
};
