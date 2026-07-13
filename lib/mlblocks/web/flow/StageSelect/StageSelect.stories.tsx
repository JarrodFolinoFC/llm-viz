import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { StageSelect } from './index';
import { TrainingStage } from '../../../core/stage';

const STAGES = [
  TrainingStage.Data,
  TrainingStage.Forward,
  TrainingStage.Loss,
  TrainingStage.Backprop,
  TrainingStage.Update,
];

// The stage filter: toggle which pipeline stages are shown in a flow.
const meta = {
  title: 'Flow/StageSelect',
  component: StageSelect,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    stages: STAGES,
    hidden: new Set([TrainingStage.Backprop]),
    onToggle: () => {},
    onShowAll: () => {},
    onHideAll: () => {},
  },
} satisfies Meta<typeof StageSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Wired to local state so the toggles actually flip.
export const Interactive: Story = {
  render: () => {
    const [hidden, setHidden] = useState<ReadonlySet<TrainingStage>>(new Set());
    return (
      <StageSelect
        stages={STAGES}
        hidden={hidden}
        onToggle={(s) =>
          setHidden((prev) => {
            const next = new Set(prev);
            next.has(s) ? next.delete(s) : next.add(s);
            return next;
          })
        }
        onShowAll={() => setHidden(new Set())}
        onHideAll={() => setHidden(new Set(STAGES))}
      />
    );
  },
};
