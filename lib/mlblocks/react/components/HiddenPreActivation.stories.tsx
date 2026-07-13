import type { Meta, StoryObj } from '@storybook/react-vite';

import { HiddenPreActivation } from './HiddenPreActivation';

// The whole hidden computation: the x⊙W₁ products, then the Σ = x·W₁, b₁,
// z₁ = x·W₁+b₁ and h = tanh(z₁) rollups. Kept internally consistent (z₁ derived
// from x, W₁ and b₁) so the per-unit working modal sums back to z₁.
const D = 4;
const H = 3;
const x = [0.4, -0.2, 0.7, 0.1];
const W1 = Array.from({ length: D }, (_, i) =>
  Array.from({ length: H }, (_, j) => Math.sin(i + 2 * j) / 2),
);
const b1 = [0.1, -0.05, 0.2];
const z1 = Array.from({ length: H }, (_, j) =>
  x.reduce((acc, xk, k) => acc + xk * W1[k][j], 0) + b1[j],
);
const hidden = z1.map(Math.tanh);

const meta = {
  title: 'Flow/HiddenPreActivation',
  component: HiddenPreActivation,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    slots: { control: false },
    posLabels: { control: false },
    x: { control: false },
    W1: { control: false },
    b1: { control: false },
    z1: { control: false },
    hidden: { control: false },
  },
  args: {
    slots: [
      { token: 'the', comp: 0 },
      { token: 'the', comp: 1 },
      { token: 'cat', comp: 0 },
      { token: 'cat', comp: 1 },
    ],
    posLabels: ['pos1·d1', 'pos1·d2', 'pos2·d1', 'pos2·d2'],
    x,
    W1,
    b1,
    z1,
    hidden,
    step: 5,
    dimmed: false,
  },
} satisfies Meta<typeof HiddenPreActivation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
