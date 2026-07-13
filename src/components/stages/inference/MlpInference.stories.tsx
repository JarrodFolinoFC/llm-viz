import type { Meta, StoryObj } from '@storybook/react-vite';

import { MlpInference } from './MlpInference';
import { CORPUS_8 } from '../../../lib/corpora';

const vocab = [...new Set(CORPUS_8.split(' '))];

// The MLP inference walkthrough — embeddings → hidden layer → softmax.
const meta = {
  title: 'Stages/Inference/MlpInference',
  component: MlpInference,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    corpus: { control: 'text' },
    dim: { control: { type: 'number', min: 1 } },
    blockSize: { control: { type: 'number', min: 1 } },
    hiddenSize: { control: { type: 'number', min: 1 } },
  },
  args: { vocab, corpus: CORPUS_8, dim: 2, blockSize: 2, hiddenSize: 4 },
} satisfies Meta<typeof MlpInference>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The scalar (d = 1) variant.
export const Scalar: Story = {
  args: { dim: 1 },
};
