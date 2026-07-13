import type { Meta, StoryObj } from '@storybook/react-vite';

import { MermaidDiagram } from './index';

// Renders a Mermaid diagram from its source string.
const meta = {
  title: 'Flow/MermaidDiagram',
  component: MermaidDiagram,
  parameters: { layout: 'centered' },
  argTypes: {
    chart: { control: 'text' },
  },
  args: {
    chart: `graph LR
  x["x (input)"] --> W["W (d×h)"]
  W --> z["z = x·W"]
  z --> y["softmax(z)"]`,
  },
} satisfies Meta<typeof MermaidDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
