import type { Meta, StoryObj } from '@storybook/react-vite';

import { RnnScalarInferencePage } from './RnnScalarInferencePage';

// Full page: the scalar RNN inference walkthrough.
const meta = {
  title: 'Pages/RnnScalarInferencePage',
  component: RnnScalarInferencePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RnnScalarInferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
