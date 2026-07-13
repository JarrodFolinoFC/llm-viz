import type { Meta, StoryObj } from '@storybook/react-vite';

import { MlpScalarInferencePage } from './MlpScalarInferencePage';

// Full page: the scalar MLP inference walkthrough.
const meta = {
  title: 'Pages/MlpScalarInferencePage',
  component: MlpScalarInferencePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MlpScalarInferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
