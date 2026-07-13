import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContextEmbeddings } from './index';

const vocab = ['the', 'cat', 'sat', 'on', '.'];
const E = vocab.map((_, i) => [Math.sin(i) / 2, Math.cos(i) / 2]);
const context = [0, 1]; // "the", "cat"
// Concatenated context embeddings (length N·d).
const x = context.flatMap((id) => E[id]);

// The MLP input step: gather each context token's embedding and concatenate into x.
const meta = {
  title: 'Stages/Inference/ContextEmbeddings',
  component: ContextEmbeddings,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    vocab: { control: false },
    context: { control: false },
    E: { control: false },
    x: { control: false },
  },
  args: { vocab, context, E, x },
} satisfies Meta<typeof ContextEmbeddings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
