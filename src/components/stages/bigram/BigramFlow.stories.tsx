import type { Meta, StoryObj } from '@storybook/react-vite';

import { BigramFlowContainer } from './BigramFlowContainer';
import { CORPUS_8 } from '../../../lib/corpora';

const VOCAB = [... new Set(CORPUS_8.split(" "))]

const meta = {
  title: 'Flows/BigramFlow',
  component: BigramFlowContainer,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    corpus: { control: 'text' },
  },
  args: {
    vocab: VOCAB,
    corpus: CORPUS_8,
  },
} satisfies Meta<typeof BigramFlowContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
