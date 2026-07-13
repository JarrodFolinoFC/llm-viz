import type { Meta, StoryObj } from '@storybook/react-vite';

import { RnnPage } from './RnnPage';

// Full page: the RNN training flow.
const meta = {
  title: 'Pages/RnnPage',
  component: RnnPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RnnPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
