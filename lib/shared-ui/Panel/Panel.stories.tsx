import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from 'antd';

import { Panel, PANEL_SIZES } from './index';

const meta = {
  title: 'shared-ui/Panel',
  component: Panel,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    size: { control: 'inline-radio', options: PANEL_SIZES },
    dimmed: { control: 'boolean' },
    extra: { control: false },
    children: { control: false },
  },
  args: {
    title: 'Panel title',
    size: 'm',
    dimmed: false,
    children: <div style={{ padding: '0.25rem 0' }}>Panel body content</div>,
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// `extra` renders in the top-right of the title bar (antd Card `extra`).
export const WithExtra: Story = {
  args: {
    extra: <Button size="small">Action</Button>,
  },
};

// `dimmed` fades + greys the panel out (e.g. an inactive step).
export const Dimmed: Story = {
  args: { dimmed: true },
};

// No `title` → the card renders without a title bar.
export const Untitled: Story = {
  args: { title: undefined },
};

// Every size variant side by side for comparison.
export const SizeComparison: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {PANEL_SIZES.map((size) => (
        <Panel {...args} key={size} size={size} title={size}>
          <div style={{ padding: '0.25rem 0' }}>{size}</div>
        </Panel>
      ))}
    </div>
  ),
};
