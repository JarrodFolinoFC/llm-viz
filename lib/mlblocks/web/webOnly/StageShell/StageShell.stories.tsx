import type { Meta, StoryObj } from '@storybook/react-vite';

import { StageShell } from './index';
import type { StepTrainerController } from '../../../react/useStepTrainer';

// The scaffold every stage container ends with: the floating dock (trainer
// controls + math console) plus the training-loss readout, wrapping the flow.
// The controller is mocked here with static data + no-op actions.
type DemoResult = {
  step: number;
  currentLoss: number;
  prevProbs: number[];
  currentPair: { prev: number; target: number };
};

const controller: StepTrainerController<DemoResult> = {
  result: {
    step: 12,
    currentLoss: 0.83,
    prevProbs: [0.1, 0.5, 0.3, 0.1],
    currentPair: { prev: 0, target: 1 },
  },
  history: Array.from({ length: 13 }, (_, step) => ({ step, loss: 2.4 * Math.exp(-step / 6) + 0.3 })),
  modelHistory: [],
  seed: 1,
  setSeed: () => {},
  lr: 0.5,
  setLr: () => {},
  shuffle: false,
  setShuffle: () => {},
  doStep: () => {},
  reset: () => {},
};

const meta = {
  title: 'Panels/StageShell',
  component: StageShell,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    controller: { control: false },
    scope: { control: false },
    vocab: { control: false },
    metric: { control: false },
    children: { control: false },
    examplesLength: { control: { type: 'number', min: 1 } },
    meanLoss: { control: { type: 'number', step: 0.01 } },
  },
  args: {
    controller,
    scope: { E: [[0.4, -0.2]], U: [[0.3, 0.5]] },
    vocab: ['the', 'cat', 'sat', '.'],
    examplesLength: 22,
    meanLoss: 0.83,
    metric: {
      label: 'dist. error',
      value: '0.12',
      explain: 'Distance between the learned distribution and the corpus statistics.',
    },
    children: (
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <h3>Flow panels go here</h3>
        <p>Each stage container supplies its own panels as children.</p>
      </div>
    ),
  },
} satisfies Meta<typeof StageShell<DemoResult>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
