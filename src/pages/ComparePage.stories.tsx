import type { Meta, StoryObj } from '@storybook/react-vite';

import { ComparePage } from './ComparePage';

// Full page: every stage trained on the same corpus, results side by side.
const meta = {
  title: 'Pages/ComparePage',
  component: ComparePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ComparePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
