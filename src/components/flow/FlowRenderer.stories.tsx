import type { Meta, StoryObj } from '@storybook/react-vite';

import { space } from '../../theme';
import { flow, FlowRenderer, type FlowSpec } from 'mlblocks';
import { VectorPanel } from 'mlblocks';
import { MatrixPanel } from 'mlblocks';
import { TrainingStage } from 'mlblocks';

/**
 * The flow DSL (Option A): a UI defined as data — `flex`/`row`/`col` layout
 * nodes (Ant Design containers) holding `panel(...)` leaves bound to a view, with
 * `arrow(...)` connectors. `FlowRenderer` interprets the tree.
 */
const meta: Meta = {
  title: 'Flows/FlowRenderer (DSL)',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// A miniature view a demo flow binds against.
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

// One layout container, three leaves: input vector → matrix → output vector.
const demoSpec: FlowSpec<DemoView> = flex(
  { wrap: true, align: 'stretch', gap: 'lg' },
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'x', phase: 'input', values: v.x, step: v.step })),
  arrow('x·W'),
  panel(TrainingStage.Parameters, MatrixPanel, (v) => ({ symbol: 'W', phase: 'd×h', matrix: v.W, step: v.step })),
  arrow('='),
  panel(TrainingStage.Forward, VectorPanel, (v) => ({ symbol: 'y', phase: 'output', values: v.out, step: v.step })),
);

// A flow assembled from the DSL and rendered against a concrete view.
export const Default: Story = {
  render: () => (
    <div style={{ padding: space.lg }}>
      <FlowRenderer spec={demoSpec} view={demoView} />
    </div>
  ),
};

// The same spec rendered against a different view — the spec is data, reusable.
export const DifferentView: Story = {
  render: () => (
    <div style={{ padding: space.lg }}>
      <FlowRenderer
        spec={demoSpec}
        view={{ x: [-0.9, 0.5, 0.1], W: [[0.8, 0.0], [-0.3, 0.6], [0.2, -0.7]], out: [-0.42, 0.18], step: 0 }}
      />
    </div>
  ),
};
