import type { Meta, StoryObj } from '@storybook/react-vite';

import { RnnScalarPage } from './RnnScalarPage';

// Full page: the scalar RNN training flow.
const meta = {
  title: 'Pages/RnnScalarPage',
  component: RnnScalarPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RnnScalarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
