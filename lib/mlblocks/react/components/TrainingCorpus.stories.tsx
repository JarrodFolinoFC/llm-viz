import type { Meta, StoryObj } from '@storybook/react-vite';

import { TrainingCorpus } from './TrainingCorpus';

// The raw corpus with the current context→target window highlighted.
const meta = {
  title: 'Flow/TrainingCorpus',
  component: TrainingCorpus,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    corpus: { control: 'text' },
    step: { control: { type: 'number', min: 0 } },
    pairIdx: { control: { type: 'number', min: 0 } },
    contextLen: { control: { type: 'number', min: 1 } },
  },
  args: {
    corpus: 'the cat sat on the mat .',
    pairIdx: 2,
    contextLen: 1,
    step: 4,
  },
} satisfies Meta<typeof TrainingCorpus>;

export default meta;
type Story = StoryObj<typeof meta>;

// A bigram window (one context token → the next).
export const Bigram: Story = {};

// A length-3 context block (the MLP/RNN stages).
export const BlockContext: Story = {
  args: { contextLen: 3, pairIdx: 3 },
};

// `pairIdx: null` hides the highlight window.
export const NoHighlight: Story = {
  args: { pairIdx: null },
};
