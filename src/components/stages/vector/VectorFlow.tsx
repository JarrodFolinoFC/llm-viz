import { DotProduct } from './DotProduct';
import { EmbeddingPair } from './EmbeddingPair';
import { EmbeddingScatter } from './EmbeddingScatter';
import { EmbeddingUpdate } from './EmbeddingUpdate';
import { GradientColumn } from 'mlblocks';
import { TrainingCorpus } from 'mlblocks';
import { flow, specFromJson, FlowRenderer, type FlowSpec } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import type { VectorViewModel } from './VectorViewModel';
import layout from './vectorFlow.spec.json';

const { panel } = flow<VectorViewModel>();

// ── The panels: every bind is a view-model getter (see VectorViewModel) ──

const corpusPanel = panel(TrainingStage.Data, TrainingCorpus, (vm) => vm.corpusPanel);
const pairBeforePanel = panel(TrainingStage.Parameters, EmbeddingPair, (vm) => vm.pairBeforePanel,
  { tensors: ['E', 'U'] });
const scatterPanel = panel(TrainingStage.Parameters, EmbeddingScatter, (vm) => vm.scatterPanel,
  { tensors: ['E', 'U'] });
const dotProductPanel = panel(TrainingStage.Forward, DotProduct, (vm) => vm.dotProductPanel,
  { tensors: ['E', 'U'] });
const gradientPanel = panel(TrainingStage.Backprop, GradientColumn, (vm) => vm.gradientPanel,
  { tensors: ['E', 'U'] });
const updatePanel = panel(TrainingStage.Update, EmbeddingUpdate, (vm) => vm.updatePanel,
  { tensors: ['E', 'U'] });
const pairAfterPanel = panel(TrainingStage.Update, EmbeddingPair, (vm) => vm.pairAfterPanel,
  { tensors: ['E', 'U'] });

/** The embedding ("vector") bigram pipeline's ARRANGEMENT lives in
 *  vectorFlow.spec.json — one row per training stage: the corpus, the
 *  before-step embeddings + scatter, the dot-product read-out, the p − y
 *  gradient, then the updated embeddings. This registry supplies the named
 *  panels the JSON references. */
export const vectorFlowSpec: FlowSpec<VectorViewModel> = specFromJson(layout, {
  nodes: {
    corpusPanel, pairBeforePanel, scatterPanel, dotProductPanel,
    gradientPanel, updatePanel, pairAfterPanel,
  },
});

export function VectorFlow({ trainer }: { trainer: VectorViewModel }) {
  return <FlowRenderer spec={vectorFlowSpec} view={trainer} />;
}
