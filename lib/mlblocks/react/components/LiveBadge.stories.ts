import type { Meta, StoryObj } from '@storybook/react-vite';

import { LiveBadge } from './LiveBadge';
import { TrainingStage } from '../../core/stage';

const meta = {
  title: 'Core/LiveBadge',
  component: LiveBadge,
  tags: ['autodocs'],
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    stage: { control: 'inline-radio', options: Object.values(TrainingStage) },
  },
} satisfies Meta<typeof LiveBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Step 0: not trained yet — shows the neutral "take a step" indicator.
export const Untrained: Story = {
  args: {
    step: 0,
  },
};

// Any non-zero step: live indicator with the current step count.
export const Live: Story = {
  args: {
    step: 7,
  },
};

export const ManySteps: Story = {
  args: {
    step: 1024,
  },
};

// With a training-stage icon next to the step.
export const WithStage: Story = {
  args: {
    step: 7,
    stage: TrainingStage.Forward,
  },
};

// Live, but the panel still shows the untouched random init (e.g. a pre-update
// weight panel at step 1) — the dot goes purple instead of green.
export const StillRandomInit: Story = {
  args: {
    step: 1,
    randomInit: true,
    stage: TrainingStage.Parameters,
  },
};
