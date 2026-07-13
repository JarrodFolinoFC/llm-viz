import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorBoundary } from './index';

function Boom(): never {
  throw new Error('Something went wrong while rendering this panel.');
}

// Catches a render-time error and shows it as an inline alert (not a blank screen).
const meta = {
  title: 'App/ErrorBoundary',
  component: ErrorBoundary,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

// A healthy child renders straight through.
export const Healthy: Story = {
  args: {
    children: <div>Everything is fine.</div>,
  },
};

// A throwing child is caught and its message + stack shown in an alert.
export const Caught: Story = {
  args: {
    children: <Boom />,
  },
};
