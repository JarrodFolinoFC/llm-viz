import type { Meta, StoryObj } from '@storybook/react-vite';

import { MlpScalarPage } from './MlpScalarPage';

// Full page: the scalar (d = 1) MLP training flow.
const meta = {
  title: 'Pages/MlpScalarPage',
  component: MlpScalarPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MlpScalarPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
