import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenChipColors } from './index';

// The legend of token-chip colours (takes no props).
const meta = {
  title: 'Core/TokenChipColors',
  component: TokenChipColors,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TokenChipColors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
