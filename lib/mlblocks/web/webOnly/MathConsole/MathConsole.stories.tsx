import type { Meta, StoryObj } from '@storybook/react-vite';

import { MathConsole } from './index';

// A small JS console with the live model variables in scope. Type an expression
// (e.g. `dot(E[0], U[0])`) and run it.
const meta = {
  title: 'Flow/MathConsole',
  component: MathConsole,
  parameters: { layout: 'centered' },
  argTypes: {
    scope: { control: false },
    vocab: { control: false },
    onClose: { control: false },
  },
  args: {
    scope: {
      E: [
        [0.4, -0.2],
        [0.1, 0.7],
      ],
      U: [
        [0.3, 0.5],
        [-0.6, 0.2],
      ],
    },
    vocab: ['the', 'cat'],
    onClose: () => {},
  },
} satisfies Meta<typeof MathConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
