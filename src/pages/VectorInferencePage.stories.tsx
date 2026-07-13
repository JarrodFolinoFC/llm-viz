import type { Meta, StoryObj } from '@storybook/react-vite';

import { VectorInferencePage } from './VectorInferencePage';

// Full page: the vector inference walkthrough. `dim` sets the embedding width.
const meta = {
  title: 'Pages/VectorInferencePage',
  component: VectorInferencePage,
  parameters: { layout: 'fullscreen' },
  argTypes: { dim: { control: { type: 'number', min: 1 } } },
  args: { dim: 2 },
} satisfies Meta<typeof VectorInferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
