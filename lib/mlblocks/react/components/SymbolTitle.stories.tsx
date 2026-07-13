import type { Meta, StoryObj } from '@storybook/react-vite';

import { SymbolTitle } from './SymbolTitle';

// The shared panel title: a LaTeX symbol followed by an optional muted phase tag.
const meta = {
  title: 'Core/SymbolTitle',
  component: SymbolTitle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    symbol: { control: 'text' },
    phase: { control: 'text' },
    parens: { control: 'boolean' },
  },
  args: {
    symbol: 'W_1',
    phase: 'before step',
  },
} satisfies Meta<typeof SymbolTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GradientSymbol: Story = {
  args: { symbol: '\\nabla W_1', phase: null },
};

export const Parenthesised: Story = {
  args: { symbol: 'h_1', phase: 'random', parens: true },
};
