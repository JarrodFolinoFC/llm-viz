import type { Meta, StoryObj } from '@storybook/react-vite';

import { MlpInferencePage } from './MlpInferencePage';

// Full page: the MLP inference walkthrough.
const meta = {
  title: 'Pages/MlpInferencePage',
  component: MlpInferencePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MlpInferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
