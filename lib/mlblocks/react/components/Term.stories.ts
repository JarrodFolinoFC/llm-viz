import type { Meta, StoryObj } from '@storybook/react-vite';

import { Term } from './Term';

const meta = {
  title: 'Core/Term',
  component: Term,
  tags: ['autodocs'],
  parameters: {
    // Tooltip content renders in a portal on hover — give it room.
    layout: 'centered',
  },
  argTypes: {
    label: { control: 'text' },
    explain: { control: 'text' },
    formula: { control: 'text' },
  },
  args: {
    label: 'softmax',
    explain: 'Turns a vector of scores into a probability distribution.',
  },
} satisfies Meta<typeof Term>;

export default meta;
type Story = StoryObj<typeof meta>;

// Hover the underlined term to reveal the explanation tooltip.
export const TextOnly: Story = {
  args: {
    label: 'logit',
    explain: 'The raw, unnormalized score a model assigns before softmax.',
  },
};

// Tooltip includes a rendered KaTeX formula beneath the explanation.
export const WithFormula: Story = {
  args: {
    label: 'softmax',
    explain: 'Turns a vector of scores into a probability distribution.',
    formula: '\\text{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}',
  },
};
