import type { Meta, StoryObj } from '@storybook/react-vite';

import { RnnInferencePage } from './RnnInferencePage';

// Full page: the RNN inference walkthrough.
const meta = {
  title: 'Pages/RnnInferencePage',
  component: RnnInferencePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RnnInferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
