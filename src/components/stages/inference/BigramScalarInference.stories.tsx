import type { Meta, StoryObj } from '@storybook/react-vite';

import { BigramScalarInference } from './BigramScalarInference';
import { CORPUS_8 } from '../../../lib/corpora';

const vocab = [...new Set(CORPUS_8.split(' '))];

// The bigram inference walkthrough — runs its own model from the corpus.
const meta = {
  title: 'Stages/Inference/BigramScalarInference',
  component: BigramScalarInference,
  parameters: { layout: 'fullscreen' },
  argTypes: { corpus: { control: 'text' } },
  args: { vocab, corpus: CORPUS_8 },
} satisfies Meta<typeof BigramScalarInference>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
