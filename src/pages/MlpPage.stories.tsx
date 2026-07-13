import type { Meta, StoryObj } from '@storybook/react-vite';

import { MlpPage } from './MlpPage';

// Full page: the MLP training flow.
const meta = {
  title: 'Pages/MlpPage',
  component: MlpPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MlpPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
