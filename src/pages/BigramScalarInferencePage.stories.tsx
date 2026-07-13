import type { Meta, StoryObj } from '@storybook/react-vite';

import { BigramScalarInferencePage } from './BigramScalarInferencePage';

// Full page: the bigram inference walkthrough.
const meta = {
  title: 'Pages/BigramScalarInferencePage',
  component: BigramScalarInferencePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BigramScalarInferencePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
