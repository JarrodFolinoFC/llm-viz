import type { Meta, StoryObj } from '@storybook/react-vite';

import { TrainingLoss, DIST_ERROR_EXPLAIN } from './TrainingLoss';

// A decaying loss curve over 20 steps.
const history = Array.from({ length: 20 }, (_, step) => ({
  step,
  loss: 2.4 * Math.exp(-step / 8) + 0.3,
}));

const meta = {
  title: 'Flow/TrainingLoss',
  component: TrainingLoss,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    meanLoss: { control: { type: 'number', step: 0.01 } },
    perplexity: { control: { type: 'number', step: 0.01 } },
    stepLoss: { control: { type: 'number', step: 0.01 } },
    metric: { control: false },
    history: { control: false },
  },
  args: {
    meanLoss: 0.83,
    perplexity: Math.exp(0.83),
    stepLoss: 0.91,
    metric: {
      label: 'dist. error',
      value: '0.12',
      explain: DIST_ERROR_EXPLAIN,
    },
    history,
    step: history.length - 1,
  },
} satisfies Meta<typeof TrainingLoss>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Step 0 — nothing trained yet, flat history.
export const Untrained: Story = {
  args: { step: 0, history: [{ step: 0, loss: 2.4 }], meanLoss: 2.4, perplexity: Math.exp(2.4) },
};
