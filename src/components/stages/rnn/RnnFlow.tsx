import type { ComponentType } from 'react';

import { EmbeddingMatrix } from 'mlblocks';
import { GradientColumn } from 'mlblocks';
import { MatrixPanel } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import { RowSoftmax } from 'mlblocks';
import { TrainingCorpus } from 'mlblocks';
import { VectorPanel } from 'mlblocks';
import { DialsNote } from 'mlblocks';
import { dialsBind } from 'mlblocks';
import { flow, specFromJson, type FlowSpec } from 'mlblocks';
import { FlowWithChart } from 'mlblocks';
import { buildRnnFlowChart } from './rnnFlowChart';
import type { RnnViewModel } from './RnnViewModel';
import layout from './rnnFlow.spec.json';

const { flex, panel } = flow<RnnViewModel>();

/** A matrix/vector panel plus its (kind-filtered) dials companion, stacked.
 *  The dials symbol/labels are derived from the panel's own binding. */
const dialed = <P,>(
  stage: TrainingStage,
  Component: ComponentType<P>,
  bind: (vm: RnnViewModel) => P,
  opts: { tensors?: readonly string[] } = {},
) =>
  flex(
    { vertical: true, gap: 'sm', align: 'stretch' },
    panel(stage, Component, bind, { tensors: opts.tensors }),
    panel(stage, DialsNote, dialsBind(bind, stage), { kind: 'dials', tensors: opts.tensors }),
  );

// ── The panels: every bind is a view-model getter (see RnnViewModel) ──

const corpusPanel = panel(TrainingStage.Data, TrainingCorpus, (vm) => vm.corpusPanel);

// Parameters — every tensor the recurrence and read-out read.
const ePanel = dialed(TrainingStage.Parameters, EmbeddingMatrix, (vm) => vm.ePanel, { tensors: ['E'] });
const wxhPanel = dialed(TrainingStage.Parameters, MatrixPanel, (vm) => vm.wxhPanel, { tensors: ['Wxh'] });
const whhPanel = dialed(TrainingStage.Parameters, MatrixPanel, (vm) => vm.whhPanel, { tensors: ['Whh'] });
const bhPanel = dialed(TrainingStage.Parameters, VectorPanel, (vm) => vm.bhPanel, { tensors: ['bh'] });
const whyPanel = dialed(TrainingStage.Parameters, MatrixPanel, (vm) => vm.whyPanel, { tensors: ['Why'] });
const byPanel = dialed(TrainingStage.Parameters, VectorPanel, (vm) => vm.byPanel, { tensors: ['by'] });

// Forward — fold each token into the running hidden state, read out the last.
const hiddensPanel = dialed(TrainingStage.Forward, MatrixPanel, (vm) => vm.hiddensPanel,
  { tensors: ['E', 'Wxh', 'Whh', 'bh'] });
const softmaxPanel = panel(TrainingStage.Forward, RowSoftmax, (vm) => vm.softmaxPanel,
  { tensors: ['Why', 'by'] });

// Backprop through time: p − y → ∇W_hy → ∇h_N → … → ∇W_xh, ∇W_hh → ∇E.
const gradientPanel = panel(TrainingStage.Backprop, GradientColumn, (vm) => vm.gradientPanel,
  { tensors: ['Why', 'by'] });
const dWhyPanel = dialed(TrainingStage.Backprop, MatrixPanel, (vm) => vm.dWhyPanel, { tensors: ['Why'] });
const dWxhPanel = dialed(TrainingStage.Backprop, MatrixPanel, (vm) => vm.dWxhPanel, { tensors: ['Wxh'] });
const dWhhPanel = dialed(TrainingStage.Backprop, MatrixPanel, (vm) => vm.dWhhPanel, { tensors: ['Whh'] });
const dEPanel = dialed(TrainingStage.Backprop, EmbeddingMatrix, (vm) => vm.dEPanel, { tensors: ['E'] });

// Update: W ← W − η·∇W.
const wxhAfterPanel = dialed(TrainingStage.Update, MatrixPanel, (vm) => vm.wxhAfterPanel, { tensors: ['Wxh'] });
const whhAfterPanel = dialed(TrainingStage.Update, MatrixPanel, (vm) => vm.whhAfterPanel, { tensors: ['Whh'] });
const whyAfterPanel = dialed(TrainingStage.Update, MatrixPanel, (vm) => vm.whyAfterPanel, { tensors: ['Why'] });
const eAfterPanel = dialed(TrainingStage.Update, EmbeddingMatrix, (vm) => vm.eAfterPanel, { tensors: ['E'] });

/** The Elman RNN pipeline's ARRANGEMENT lives in rnnFlow.spec.json — one row
 *  per training stage: recurrence params → forward read-out → BPTT → update.
 *  This registry supplies the named panels the JSON references. */
export const rnnFlowSpec: FlowSpec<RnnViewModel> = specFromJson(layout, {
  nodes: {
    corpusPanel, ePanel, wxhPanel, whhPanel, bhPanel, whyPanel, byPanel,
    hiddensPanel, softmaxPanel,
    gradientPanel, dWhyPanel, dWxhPanel, dWhhPanel, dEPanel,
    wxhAfterPanel, whhAfterPanel, whyAfterPanel, eAfterPanel,
  },
});

export function RnnFlow({ trainer }: { trainer: RnnViewModel }) {
  return <FlowWithChart spec={rnnFlowSpec} view={trainer} buildChart={buildRnnFlowChart} />;
}
