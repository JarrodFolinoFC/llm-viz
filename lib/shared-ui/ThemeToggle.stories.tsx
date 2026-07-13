import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeToggle } from './ThemeToggle';

// Reads/flips the shared `useTheme` mode (the lib/ui preview already wraps every
// story in a ThemeProvider), so clicking it toggles the whole preview light/dark.
const meta = {
  title: 'shared-ui/ThemeToggle',
  component: ThemeToggle,
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'inline-radio', options: ['text', 'default', 'primary', 'dashed', 'link'] },
    shape: { control: 'inline-radio', options: ['circle', 'default', 'round'] },
  },
  args: {
    type: 'text',
    shape: 'circle',
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// A bordered button instead of the bare text icon.
export const Outlined: Story = {
  args: { type: 'default' },
};
