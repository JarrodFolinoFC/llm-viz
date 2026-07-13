import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmbeddingScatter } from './index';

const vocab = ['the', 'cat', 'sat', 'on', '.'];
const E = vocab.map((_, i) => [Math.sin(i) / 2, Math.cos(i) / 2]);
const U = vocab.map((_, i) => [Math.cos(i) / 2, Math.sin(i) / 2]);
// Pre-step copies, nudged slightly so the "moved" tokens ghost from their old spot.
const EBefore = E.map((r) => r.map((v) => v - 0.05));
const UBefore = U.map((r) => r.map((v) => v + 0.04));

// A 2-d scatter of the embedding (E) and unembedding (U) vectors.
const meta = {
  title: 'Stages/Vector/EmbeddingScatter',
  component: EmbeddingScatter,
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    vocab: { control: false },
    E: { control: false },
    EBefore: { control: false },
    U: { control: false },
    UBefore: { control: false },
    flash: { control: false },
  },
  args: { vocab, E, EBefore, U, UBefore, step: 5, flash: null },
} satisfies Meta<typeof EmbeddingScatter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
