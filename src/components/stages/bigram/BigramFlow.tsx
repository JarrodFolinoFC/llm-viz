import type { ComponentType } from 'react';

import { space } from '../../../theme';
import { FlashMatrixTable } from './FlashMatrixTable';
import { GradientUpdate } from './GradientUpdate';
import { PreviousSoftmax } from 'mlblocks';
import { WeightMatrix } from './WeightMatrix';
import { WeightHistoryMatrix } from './WeightHistoryMatrix';
import { RowSoftmax } from 'mlblocks';
import { TrainingCorpus } from 'mlblocks';
import { DialsNote } from 'mlblocks';
import { dialsBind } from 'mlblocks';
import { flow, specFromJson, type FlowSpec } from 'mlblocks';
import { FlowWithChart } from 'mlblocks';
import { TrainingStage } from 'mlblocks';
import { buildBigramFlowChart } from './bigramFlowChart';
import type { BigramViewModel } from './BigramViewModel';
import layout from './bigramFlow.spec.json';

const { flex, panel } = flow<BigramViewModel>();

/** A matrix/vector panel plus its (kind-filtered) dials companion, stacked. */
const dialed = <P,>(
  stage: TrainingStage,
  Component: ComponentType<P>,
  bind: (vm: BigramViewModel) => P,
  opts: { tensors?: readonly string[]; symbol?: string } = {},
) =>
  flex(
    { vertical: true, gap: 'sm', align: 'stretch' },
    panel(stage, Component, bind, { tensors: opts.tensors }),
    panel(stage, DialsNote, dialsBind(bind, stage, opts.symbol), { kind: 'dials', tensors: opts.tensors }),
  );

// ── The panels: every bind is a view-model getter (see BigramViewModel) ──

const corpusPanel = panel(TrainingStage.Data, TrainingCorpus, (vm) => vm.corpusPanel);
const wPanel = dialed(TrainingStage.Parameters, WeightMatrix, (vm) => vm.wPanel,
  { tensors: ['W'], symbol: 'W' });
const historyPanel = panel(TrainingStage.Parameters, WeightHistoryMatrix, (vm) => vm.historyPanel,
  { tensors: ['W'] });
const prevSoftmaxPanel = panel(TrainingStage.Forward, PreviousSoftmax, (vm) => vm.prevSoftmaxPanel,
  { tensors: ['W'] });
const rowSoftmaxPanel = panel(TrainingStage.Forward, RowSoftmax, (vm) => vm.rowSoftmaxPanel,
  { tensors: ['W'] });
const gradientUpdatePanel = panel(TrainingStage.Backprop, GradientUpdate, (vm) => vm.gradientUpdatePanel,
  { tensors: ['W'] });
const newWPanel = dialed(TrainingStage.Update, FlashMatrixTable, (vm) => vm.newWPanel,
  { tensors: ['W'], symbol: 'W' });

/**
 * The scalar bigram pipeline's ARRANGEMENT lives in bigramFlow.spec.json (one
 * row per training stage; the weights and update rows share the grid's column
 * tracks so the post-step W sits exactly under its pre-step counterpart).
 * This registry supplies the named panels the JSON references.
 */
export const bigramFlowSpec: FlowSpec<BigramViewModel> = specFromJson(layout, {
  nodes: {
    corpusPanel, wPanel, historyPanel, prevSoftmaxPanel,
    rowSoftmaxPanel, gradientUpdatePanel, newWPanel,
  },
  spaces: { lg: space.lg, sm: space.sm },
});

export function BigramFlow({ trainer }: { trainer: BigramViewModel }) {
  return <FlowWithChart spec={bigramFlowSpec} view={trainer} buildChart={buildBigramFlowChart} />;
}
