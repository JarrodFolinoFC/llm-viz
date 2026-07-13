import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormulaDisplay } from './FormulaDisplay';

const meta = {
  title: 'Core/FormulaDisplay',
  component: FormulaDisplay,
  tags: ['autodocs'],
  argTypes: {
    latex: { control: 'text' },
    inline: { control: 'boolean' },
  },
  args: {
    latex: 'P(w_t \\mid w_{t-1})',
  },
} satisfies Meta<typeof FormulaDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Block (display) mode — centered, larger.
export const Display: Story = {
  args: {
    latex: '\\text{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}',
  },
};

// Inline mode — flows with surrounding text.
export const Inline: Story = {
  args: {
    latex: 'e^{i\\pi} + 1 = 0',
    inline: true,
  },
};

export const CrossEntropyLoss: Story = {
  args: {
    latex: 'L = -\\sum_{i} y_i \\log \\hat{y}_i',
  },
};
