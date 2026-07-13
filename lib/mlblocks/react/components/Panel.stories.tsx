import type { Meta, StoryObj } from '@storybook/react-vite';

import { Panel } from './Panel';

const meta = {
  title: 'Core/Panel',
  component: Panel,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['s', 'm', 'l'] },
  },
  args: {
    title: 'Bigram counts',
    step: 5,
    dimmed: false,
    children: <div style={{ padding: '0.5rem' }}>Panel body content</div>,
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Step 0 renders the "not trained yet" badge in the header.
export const Untrained: Story = {
  args: {
    step: 0,
  },
};

// `dimmed` greys out and fades the panel (used for inactive panels).
export const Dimmed: Story = {
  args: {
    dimmed: true,
  },
};

// `size` scales the title-bar height, padding, and font size.
export const Small: Story = {
  args: {
    size: 's',
  },
};

export const Medium: Story = {
  args: {
    size: 'm',
  },
};

export const Large: Story = {
  args: {
    size: 'l',
  },
};

// All three sizes side by side for comparison.
export const SizeComparison: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Panel {...args} size="s" title="Small" />
      <Panel {...args} size="m" title="Medium" />
      <Panel {...args} size="l" title="Large" />
    </div>
  ),
};
