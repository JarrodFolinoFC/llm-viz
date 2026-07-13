import type { Meta, StoryObj } from '@storybook/react-vite';

import { PhaseTag } from './PhaseTag';

// A muted suffix tag shown after a panel symbol (e.g. "before step", "(random)").
const meta = {
  title: 'Core/PhaseTag',
  component: PhaseTag,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    phase: { control: 'text' },
    parens: { control: 'boolean' },
  },
  args: {
    phase: 'before step',
    parens: false,
  },
} satisfies Meta<typeof PhaseTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// `parens` wraps the phase in parentheses.
export const Parenthesised: Story = {
  args: { phase: 'random', parens: true },
};

// No phase → renders nothing.
export const Empty: Story = {
  args: { phase: null },
};
