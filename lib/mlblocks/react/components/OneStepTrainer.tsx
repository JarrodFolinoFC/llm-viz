import type { ReactNode } from 'react';

import { useP } from '../primitives/context';
import { Panel } from './Panel';
import { Term } from './Term';

export interface OneStepTrainerProps {
  seed: number;
  onSeedChange: (seed: number) => void;
  lr: number;
  onLrChange: (lr: number) => void;
  /** Train on a seeded shuffle of the examples instead of corpus order. */
  shuffle?: boolean;
  onShuffleChange?: (shuffle: boolean) => void;
  /** Stage-specific training controls (e.g. the vector stage's tie-weights toggle). */
  extras?: ReactNode;
  examplesLength: number;
  step: number;
  onStep: (n: number) => void;
  onReset: () => void;
}

/** A labelled headline number (the step/epoch statistics). */
function Stat({ title, value }: { title: ReactNode; value: number }) {
  const P = useP();
  return (
    <P.View direction="col" gap={2}>
      <P.Text sty={{ font: 'sm', color: 'textSecondary' }}>{title}</P.Text>
      <P.Text sty={{ fontRem: 1.1, tabular: true }}>{value}</P.Text>
    </P.View>
  );
}

export function OneStepTrainer({
  seed,
  onSeedChange,
  lr,
  onLrChange,
  shuffle,
  onShuffleChange,
  extras,
  examplesLength,
  step,
  onStep,
  onReset,
}: OneStepTrainerProps) {
  const P = useP();
  // The "n = step" keyboard shortcut is bound globally (the host registers it
  // through StepBindingProvider) so it works even when this panel is closed.
  const epoch = examplesLength ? Math.floor(step / examplesLength) : 0;
  const intoEpoch = examplesLength ? step % examplesLength : 0;
  const epochPercent = examplesLength ? Math.round((intoEpoch / examplesLength) * 100) : 0;

  return (
    <Panel title="One-step trainer" step={step} dimmed={false}>
      <P.View direction="col" gap="sm">
        <P.View gap="md" wrap align="center">
          <P.View gap="xs" align="center">
            <Term
              label="seed"
              explain="Random seed: fixes the random number generator so weight initialization and any shuffling are reproducible. Same seed → same run; change it to try a different starting point."
            />
            <P.InputNumber value={seed} onChange={onSeedChange} />
          </P.View>
          <P.View gap="xs" align="center">
            <Term
              label="lr"
              explain="Learning rate (η): how big a step each update takes down the loss gradient. Higher learns faster but can overshoot and diverge; lower is stabler but slower."
              formula="\theta \leftarrow \theta - \eta \, \nabla_\theta \mathcal{L}"
            />
            <P.InputNumber min={0} step={0.05} value={lr} onChange={onLrChange} />
          </P.View>
          {onShuffleChange && (
            <P.View gap="xs" align="center">
              <P.Checkbox checked={!!shuffle} onChange={onShuffleChange}>
                <Term
                  label="shuffle"
                  explain="Train on a seeded shuffle of the examples instead of corpus order. Corpus order replays the same sequence every epoch (a visible rhythm in the loss curve); real training loops sample batches randomly. Toggling re-initialises the run."
                />
              </P.Checkbox>
            </P.View>
          )}
          {extras}
        </P.View>

        <P.View gap="sm" wrap align="center">
          <P.View gap={2}>
            <P.Tip content="keyboard shortcut: n">
              <P.Button variant="primary" onPress={() => onStep(1)}>
                Step +1
              </P.Button>
            </P.Tip>
            <P.Button onPress={() => onStep(10)}>+10</P.Button>
            <P.Button onPress={() => onStep(examplesLength)}>Epoch</P.Button>
          </P.View>
          <P.Button variant="danger" onPress={onReset}>
            Reset
          </P.Button>
        </P.View>

        <P.View gap="xs" align="center" sty={{ font: 'sm', color: 'textSecondary' }}>
          <P.Text
            label="the n key"
            sty={{
              mono: true,
              font: 'xs',
              px: 'xs',
              bg: 'surfaceSubtle',
              borderColor: 'border',
              radius: 'sm',
              bold: true,
              color: 'text',
            }}
          >
            n
          </P.Text>
          <P.Text>steps +1 — works anywhere on the page</P.Text>
        </P.View>

        <P.View gap="lg" wrap>
          <Stat
            title={
              <Term
                label="step"
                explain="Total number of training pairs processed so far. Each step does one forward pass + weight update on a single (context → next-token) pair."
              />
            }
            value={step}
          />
          <Stat
            title={
              <Term
                label="epoch"
                explain="One full pass over all training pairs. Computed as step ÷ pairs-per-epoch, so it increments once every full sweep through the corpus."
                formula="\text{epoch} = \left\lfloor \frac{\text{step}}{N_{\text{pairs}}} \right\rfloor"
              />
            }
            value={epoch}
          />
        </P.View>

        <P.View direction="col" gap={2}>
          <P.View justify="between" sty={{ font: 'sm', color: 'textSecondary' }}>
            <P.Text>{step > 0 ? `Epoch ${epoch} progress` : 'Training not started'}</P.Text>
            <P.Text sty={{ tabular: true }}>
              {intoEpoch}/{examplesLength} examples
            </P.Text>
          </P.View>
          <P.Meter percent={epochPercent} />
        </P.View>
      </P.View>
    </Panel>
  );
}
