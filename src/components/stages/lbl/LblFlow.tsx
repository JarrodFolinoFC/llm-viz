import { EmbeddingMatrix } from 'mlblocks';
import { GradientColumn } from 'mlblocks';
import { MatrixPanel } from 'mlblocks';
import { RowSoftmax } from 'mlblocks';
import { TrainingCorpus } from 'mlblocks';
import { VectorPanel } from 'mlblocks';
import { flow, specFromJson, FlowRenderer, type FlowSpec } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import { WeightUpdateWorking } from '../mlp/WeightUpdateWorking';
import { BiasUpdateWorking } from '../mlp/BiasUpdateWorking';
import { space } from '../../../theme';
import type { LblViewModel } from './LblViewModel';
import layout from './lblFlow.spec.json';

const { panel } = flow<LblViewModel>();

// ── The panels: every bind is a view-model getter (see LblViewModel) ──

const corpusPanel = panel(TrainingStage.Data, TrainingCorpus, (vm) => vm.corpusPanel);
const ePanel = panel(TrainingStage.Parameters, EmbeddingMatrix, (vm) => vm.ePanel, { tensors: ['E'] });
const xPanel = panel(TrainingStage.Forward, VectorPanel, (vm) => vm.xPanel, { tensors: ['E'] });
const wPanel = panel(TrainingStage.Parameters, MatrixPanel, (vm) => vm.wPanel, { tensors: ['W'] });
const bPanel = panel(TrainingStage.Parameters, VectorPanel, (vm) => vm.bPanel, { tensors: ['b'] });
const softmaxPanel = panel(TrainingStage.Forward, RowSoftmax, (vm) => vm.softmaxPanel, { tensors: ['W', 'b'] });
const gradientPanel = panel(TrainingStage.Backprop, GradientColumn, (vm) => vm.gradientPanel, { tensors: ['W', 'b'] });
const dWWorkingPanel = panel(TrainingStage.Backprop, WeightUpdateWorking, (vm) => vm.dWWorkingPanel, { tensors: ['W'] });
const dbWorkingPanel = panel(TrainingStage.Update, BiasUpdateWorking, (vm) => vm.dbWorkingPanel, { tensors: ['b'] });
const dEPanel = panel(TrainingStage.Backprop, EmbeddingMatrix, (vm) => vm.dEPanel, { tensors: ['E'] });
const eAfterPanel = panel(TrainingStage.Update, EmbeddingMatrix, (vm) => vm.eAfterPanel, { tensors: ['E'] });
const wAfterPanel = panel(TrainingStage.Update, MatrixPanel, (vm) => vm.wAfterPanel, { tensors: ['W'] });
const bAfterPanel = panel(TrainingStage.Update, VectorPanel, (vm) => vm.bAfterPanel, { tensors: ['b'] });

/** The log-bilinear pipeline's ARRANGEMENT lives in lblFlow.spec.json: the
 *  corpus + loss row, the parameters (E, the concatenated x, W, b), the worked
 *  softmax, the backprop chain (p−y → ∇W = x⊗(p−y), ∇E), the worked bias
 *  update, then the post-step parameters. This registry supplies the named
 *  panels the JSON references. */
export const lblFlowSpec: FlowSpec<LblViewModel> = specFromJson(layout, {
  nodes: {
    corpusPanel, ePanel, xPanel, wPanel, bPanel,
    softmaxPanel, gradientPanel, dWWorkingPanel, dbWorkingPanel, dEPanel,
    eAfterPanel, wAfterPanel, bAfterPanel,
  },
  spaces: { lg: space.lg, sm: space.sm },
});

export function LblFlow({ trainer }: { trainer: LblViewModel }) {
  return <FlowRenderer spec={lblFlowSpec} view={trainer} />;
}
