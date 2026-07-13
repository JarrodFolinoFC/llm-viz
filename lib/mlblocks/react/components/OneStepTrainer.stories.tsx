import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { OneStepTrainer } from './OneStepTrainer';

const meta = {
  title: 'Panels/OneStepTrainer',
  component: OneStepTrainer,
  parameters: { layout: 'centered' },
  argTypes: {
    seed: { control: { type: 'number', min: 0 } },
    lr: { control: { type: 'number', min: 0, step: 0.05 } },
    examplesLength: { control: { type: 'number', min: 1 } },
    step: { control: { type: 'number', min: 0 } },
    onSeedChange: { control: false },
    onLrChange: { control: false },
    onStep: { control: false },
    onReset: { control: false },
  },
  args: {
    seed: 1,
    lr: 0.5,
    examplesLength: 22,
    step: 7,
    onSeedChange: () => {},
    onLrChange: () => {},
    onStep: () => {},
    onReset: () => {},
  },
} satisfies Meta<typeof OneStepTrainer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Static snapshot mid-training (epoch progress bar partway through).
export const Default: Story = {};

// Just initialized — the progress bar is empty and the readout says so.
export const NotStarted: Story = {
  args: { step: 0 },
};

// Fully wired with local state so the buttons and inputs actually drive the panel.
export const Interactive: Story = {
  render: () => {
    const [seed, setSeed] = useState(1);
    const [lr, setLr] = useState(0.5);
    const [step, setStep] = useState(0);
    const examplesLength = 22;
    return (
      <OneStepTrainer
        seed={seed}
        onSeedChange={setSeed}
        lr={lr}
        onLrChange={setLr}
        examplesLength={examplesLength}
        step={step}
        onStep={(n) => setStep((s) => s + n)}
        onReset={() => setStep(0)}
      />
    );
  },
};
