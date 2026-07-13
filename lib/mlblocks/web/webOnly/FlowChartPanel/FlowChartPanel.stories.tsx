import type { Meta, StoryObj } from '@storybook/react-vite';

import { FlowChartPanel } from './index';

// A Panel-wrapped Mermaid flow chart for a training stage.
const meta = {
  title: 'Flow/FlowChartPanel',
  component: FlowChartPanel,
  parameters: { layout: 'centered' },
  argTypes: {
    chart: { control: 'text' },
    step: { control: { type: 'number', min: 0 } },
  },
  args: {
    step: 5,
    chart: `graph LR
  data["corpus"] --> fwd["forward"]
  fwd --> loss["loss"]
  loss --> back["backprop"]
  back --> upd["update"]`,
  },
} satisfies Meta<typeof FlowChartPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Step 0 marks the panel as not-yet-trained.
export const Untrained: Story = {
  args: { step: 0 },
};
