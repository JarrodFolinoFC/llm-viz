import type { Meta, StoryObj } from '@storybook/react-vite';

import { BigramPage } from './BigramPage';

// Full page: the bigram training flow over the built-in corpus.
const meta = {
  title: 'Pages/BigramPage',
  component: BigramPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BigramPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
