import type { Meta, StoryObj } from '@storybook/react-vite';

import { VectorInference } from './VectorInference';
import { CORPUS_8 } from '../../../lib/corpora';

const vocab = [...new Set(CORPUS_8.split(' '))];

// The vector (embedding · unembedding) inference walkthrough.
const meta = {
  title: 'Stages/Inference/VectorInference',
  component: VectorInference,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    corpus: { control: 'text' },
    dim: { control: { type: 'number', min: 1 } },
  },
  args: { vocab, corpus: CORPUS_8, dim: 2 },
} satisfies Meta<typeof VectorInference>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
