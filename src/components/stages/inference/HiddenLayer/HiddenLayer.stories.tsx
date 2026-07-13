import type { Meta, StoryObj } from '@storybook/react-vite';

import { HiddenLayer } from './index';

// The inference-time hidden layer: z₁ and h = tanh(z₁).
const z1 = [0.42, -0.18, 0.07, -0.55, 0.31];
const hidden = z1.map((z) => Math.tanh(z));

const meta = {
  title: 'Stages/Inference/HiddenLayer',
  component: HiddenLayer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    z1: { control: false },
    hidden: { control: false },
  },
  args: { z1, hidden },
} satisfies Meta<typeof HiddenLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
