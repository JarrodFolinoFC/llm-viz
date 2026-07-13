import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { FloatingDock } from './index';

// The sticky page dock: the one-step trainer controls plus the math-console
// launcher, wrapping the page content (here a placeholder).
const meta = {
  title: 'Panels/FloatingDock',
  component: FloatingDock,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    seed: { control: { type: 'number', min: 0 } },
    lr: { control: { type: 'number', min: 0, step: 0.05 } },
    examplesLength: { control: { type: 'number', min: 1 } },
    step: { control: { type: 'number', min: 0 } },
    scope: { control: false },
    vocab: { control: false },
    children: { control: false },
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
    scope: { E: [[0.4, -0.2]], U: [[0.3, 0.5]] },
    vocab: ['the', 'cat'],
    onSeedChange: () => {},
    onLrChange: () => {},
    onStep: () => {},
    onReset: () => {},
    children: (
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <h3>Page content</h3>
        <p>The dock wraps the flow panels and exposes the math console to them.</p>
      </div>
    ),
  },
} satisfies Meta<typeof FloatingDock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Fully wired so the trainer buttons drive the step counter.
export const Interactive: Story = {
  render: (args) => {
    const [seed, setSeed] = useState(1);
    const [lr, setLr] = useState(0.5);
    const [step, setStep] = useState(0);
    return (
      <FloatingDock
        {...args}
        seed={seed}
        onSeedChange={setSeed}
        lr={lr}
        onLrChange={setLr}
        step={step}
        onStep={(n) => setStep((s) => s + n)}
        onReset={() => setStep(0)}
      />
    );
  },
};
