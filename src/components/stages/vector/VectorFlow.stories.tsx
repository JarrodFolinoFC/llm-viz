import type { Meta, StoryObj } from '@storybook/react-vite';

import { VectorFlowContainer } from './VectorFlowContainer';
import { CORPUS_22 } from '../../../lib/corpora';

const VOCAB = [...new Set(CORPUS_22.split(' '))];

const meta = {
  title: 'Flows/VectorFlow',
  component: VectorFlowContainer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    corpus: { control: 'text' },
    dim: { control: { type: 'number', min: 2, max: 8 } },
  },
  args: {
    vocab: VOCAB,
    corpus: CORPUS_22,
    dim: 2,
  },
} satisfies Meta<typeof VectorFlowContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

// The embedding bigram with a 2-D bottleneck (the scatter plot is planar).
export const TwoDimensional: Story = {};
