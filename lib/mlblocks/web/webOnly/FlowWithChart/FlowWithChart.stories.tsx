import type { Meta, StoryObj } from '@storybook/react-vite';

import { FlowWithChart } from './index';
import { flow, type FlowSpec } from '../../../react/flow/spec';
import { VectorPanel } from '../../../react/components/VectorPanel';
import { MatrixPanel } from '../../../react/components/MatrixPanel';
import { TrainingStage } from '../../../core/stage';

// FlowWithChart pairs a data-defined flow (the panels) with a Mermaid chart of
// the same pipeline, plus the stage filter that hides/shows stages in both.
interface DemoView {
  x: number[];
  W: number[][];
  out: number[];
  step: number;
}

const demoView: DemoView = {
  x: [0.4, -0.2, 0.7],
  W: [
    [0.3, -0.5],
    [0.1, 0.4],
    [-0.6, 0.2],
  ],
  out: [0.05, 0.31],
  step: 4,
};

const { flex, panel, arrow } = flow<DemoView>();

const spec: FlowSpec<DemoView> = flex(
  { wrap: true, align: 'stretch', gap: 'lg' },
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'x', phase: 'input', values: v.x, step: v.step })),
  arrow('x·W'),
  panel(TrainingStage.Parameters, MatrixPanel, (v) => ({ symbol: 'W', phase: 'd×h', matrix: v.W, step: v.step })),
  arrow('='),
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'y', phase: 'output', values: v.out, step: v.step })),
);

const buildChart = () => `graph LR
  x["x (input)"] --> W["W (d×h)"]
  W --> y["y = softmax(x·W)"]`;

const meta = {
  title: 'Flows/FlowWithChart',
  component: FlowWithChart,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    spec: { control: false },
    view: { control: false },
    buildChart: { control: false },
  },
  args: {
    spec,
    view: demoView,
    buildChart,
  },
} satisfies Meta<typeof FlowWithChart<DemoView>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
