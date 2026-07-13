import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenChip } from './TokenChip';

const meta = {
  title: 'Core/TokenChip',
  component: TokenChip,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
    isPrev: { control: 'boolean' },
  },
  args: {
    text: 'cat',
  },
} satisfies Meta<typeof TokenChip>;

export default meta;
type Story = StoryObj<typeof meta>;

// A "next" token — the default info-colored chip.
export const Next: Story = {
  args: {
    text: 'cat',
  },
};

// A "previous" token — uses the highlight background.
export const Previous: Story = {
  args: {
    text: 'the',
    isPrev: true,
  },
};

export const Punctuation: Story = {
  args: {
    text: '.',
  },
};
