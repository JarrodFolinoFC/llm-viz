import type { Meta, StoryObj } from '@storybook/react-vite';

import { VectorPanel } from './VectorPanel';
import { TrainingStage } from '../../core/stage';

const HIDDEN = [0.42, -0.31, 0.88, -0.05, 0.67, -0.92, 0.13, 0.54];

const meta = {
  title: 'Panels/VectorPanel',
  component: VectorPanel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    symbol: { control: 'text' },
    phase: { control: 'text' },
    values: { control: 'object' },
    step: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
    highlightedRow: { control: { type: 'number', min: 0 } },
    rowHeadings: { control: false },
  },
  args: {
    symbol: 'h',
    phase: 'tanh(x·W₁+b₁)',
    stage: TrainingStage.Forward,
    values: HIDDEN,
    step: 5,
    dimmed: false,
  },
} satisfies Meta<typeof VectorPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// The hidden activations of the MLP — one signed-tinted value per unit.
export const Hidden: Story = {};

// A backprop gradient vector (∇z₁); same panel, different quantity.
export const Gradient: Story = {
  args: {
    symbol: '\\nabla z_1',
    phase: 'H',
    values: [0.02, -0.11, 0.34, -0.4, 0.08, 0.0, -0.27, 0.19],
  },
};

// A longer vector (the output logits) with the target slot highlighted.
export const LogitsWithTarget: Story = {
  args: {
    symbol: 'logits',
    phase: 'h·W₂+b₂',
    values: [-1.2, 0.4, 2.1, -0.3, 1.7, -2.4, 0.9, 0.1, -0.8, 1.3, -0.2, 0.6],
    highlightedRow: 2,
  },
};

// Custom per-element labels (the concatenated context-embedding slots, x).
export const LabeledInput: Story = {
  args: {
    symbol: 'x',
    phase: 'N·d',
    values: [0.21, -0.4, 0.11, -0.7, 0.33, 0.05],
    rowHeadings: ['the·0', 'the·1', 'the·2', 'cat·0', 'cat·1', 'cat·2'],
  },
};

// Step 0 dims the panel (the "not trained yet" state shared across the flow).
export const Dimmed: Story = {
  args: { step: 0, dimmed: true },
};
