import type { Meta, StoryObj } from '@storybook/react-vite';

import { VectorPage } from './VectorPage';

// Full page: the vector (embedding) training flow. `dim` sets the embedding width.
const meta = {
  title: 'Pages/VectorPage',
  component: VectorPage,
  parameters: { layout: 'fullscreen' },
  argTypes: { dim: { control: { type: 'number', min: 1 } } },
  args: { dim: 2 },
} satisfies Meta<typeof VectorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Scalar: Story = {
  args: { dim: 1 },
};
