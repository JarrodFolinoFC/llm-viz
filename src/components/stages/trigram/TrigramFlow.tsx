import { space } from '../../../theme';
import styles from './TrigramFlow.module.css';
import { GradientColumn } from 'mlblocks';
import { MatrixPanel } from 'mlblocks';
import { RowSoftmax } from 'mlblocks';
import { TrainingCorpus } from 'mlblocks';
import { flow, specFromJson, FlowRenderer, type FlowSpec } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import type { TrigramViewModel } from './TrigramViewModel';
import layout from './trigramFlow.spec.json';

const { panel } = flow<TrigramViewModel>();

// ── The panels: every bind is a view-model getter (see TrigramViewModel) ──

const corpusPanel = panel(TrainingStage.Data, TrainingCorpus, (vm) => vm.corpusPanel);
// The V×V×V tensor as V slice tables — W[c] for each first-context token c.
const slicePanels = Object.fromEntries(
  Array.from({ length: 8 }, (_, c) => [
    `slice${c}`,
    panel(TrainingStage.Parameters, MatrixPanel, (vm) => vm.slicePanels[c], { tensors: ['W'] }),
  ]),
);
const softmaxPanel = panel(TrainingStage.Forward, RowSoftmax, (vm) => vm.softmaxPanel,
  { tensors: ['W'] });
const gradientPanel = panel(TrainingStage.Backprop, GradientColumn, (vm) => vm.gradientPanel,
  { tensors: ['W'] });
const afterPanel = panel(TrainingStage.Update, MatrixPanel, (vm) => vm.afterPanel,
  { tensors: ['W'] });

/** The scalar trigram pipeline's ARRANGEMENT lives in trigramFlow.spec.json —
 *  the corpus + loss row, the eight W[c] slices (the 3-D tensor, one V×V table
 *  per first-context token), the worked softmax for the active (c, a) row, the
 *  p − y gradient, then the trained slice after the step. This registry
 *  supplies the named panels the JSON references. */
export const trigramFlowSpec: FlowSpec<TrigramViewModel> = specFromJson(layout, {
  nodes: { corpusPanel, ...slicePanels, softmaxPanel, gradientPanel, afterPanel },
  classNames: { slices: styles.slices },
  spaces: { lg: space.lg, sm: space.sm },
});

export function TrigramFlow({ trainer }: { trainer: TrigramViewModel }) {
  return <FlowRenderer spec={trigramFlowSpec} view={trainer} />;
}
