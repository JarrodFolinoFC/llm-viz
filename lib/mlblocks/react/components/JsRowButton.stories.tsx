import type { Meta, StoryObj } from '@storybook/react-vite';

import { JsRowButton } from './JsRowButton';
import { MathConsoleContext } from '../flow/mathConsole';
import type { Snippet } from '../lib/snippets';

const snippet: Snippet = {
  plain: 'dot(e[0], u[0])',
  verbose: ['const e = E[0], u = U[0];', 'console.log(e.map((x, k) => x * u[k]));'].join('\n'),
  uses: ['dot'],
};

// The per-row "JS" affordance. It only renders when a math console is available,
// so the story supplies one via the context provider.
const meta = {
  title: 'Flow/JsRowButton',
  component: JsRowButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <MathConsoleContext.Provider value={{ available: true, send: (s) => console.log('send', s) }}>
        <Story />
      </MathConsoleContext.Provider>
    ),
  ],
  argTypes: {
    label: { control: 'text' },
    snippet: { control: false },
  },
  args: {
    snippet,
    label: 'this row',
  },
} satisfies Meta<typeof JsRowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
