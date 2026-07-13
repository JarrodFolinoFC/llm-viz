import { argmax } from 'mlblocks/core';
import { TrainingStage } from 'mlblocks';
import { assembleFlowChart, formatVec, type ChartNode, type ChartEdge } from 'mlblocks';
import type { RnnFlowView } from './RnnFlowContainer';

/**
 * Build the RNN pipeline's overview chart from the current step's view. The
 * recurrence is summarised as a single h_N node (the running state after the last
 * step) feeding the read-out; the live hidden vector, softmax P, and output
 * gradient p − y are the same quantities the panels render, so the chart stays in
 * sync as you step. Stages in `hidden` drop out (with dangling edges).
 */
export function buildRnnFlowChart(
  v: RnnFlowView,
  hidden: ReadonlySet<TrainingStage>,
  precision = 2,
): string {
  const fmt = (x: number) => x.toFixed(precision);
  const vec = (xs: number[]) => formatVec(xs, precision);

  const ctx = v.context.map((c) => v.vocab[c]).join(' · ') || '∅';
  const tgt = v.vocab[v.target] ?? '?';
  const V = v.vocab.length;
  const d = v.E[0]?.length ?? 0;
  const H = v.bh.length;

  const probs = v.softmaxRows.map((r) => r[2]);
  const grad = v.gradientRows.map((r) => r[2]);
  const predictedIdx = argmax(probs);
  const predicted = v.vocab[predictedIdx] ?? '?';
  const hit = predictedIdx === v.target;
  // Before the first step nothing has been computed — match the panels' hints.
  const live = v.step > 0;

  const nodes: ChartNode[] = [
    { id: 'corpus', stage: TrainingStage.Data, title: 'Training corpus', lines: [`${V}-word vocab`] },
    { id: 'example', stage: TrainingStage.Data, title: 'Example', lines: [`context: ${ctx}`, `target: ${tgt}`] },
    { id: 'emb', stage: TrainingStage.Parameters, title: 'E (embeddings)', lines: [`${V}×${d}`] },
    { id: 'wxh', stage: TrainingStage.Parameters, title: 'W_xh (input)', lines: [`${d}×${H}`] },
    { id: 'whh', stage: TrainingStage.Parameters, title: 'W_hh (recurrence)', lines: [`${H}×${H}`] },
    { id: 'why', stage: TrainingStage.Parameters, title: 'W_hy (read-out)', lines: [`${H}×${V}`] },
    { id: 'hid', stage: TrainingStage.Forward, title: 'h_N = tanh(x·W_xh + h·W_hh + b_h)', lines: live ? [vec(v.hN)] : [] },
    {
      id: 'prob',
      stage: TrainingStage.Forward,
      title: 'P = softmax(h_N·W_hy + b_y)',
      lines: live
        ? [vec(probs), `prediction: ${predicted} ${hit ? '✓' : `✗ (target ${tgt})`}`]
        : ['(untrained — take a step)'],
    },
    { id: 'grad', stage: TrainingStage.Backprop, title: '∂L/∂logits = p − y', lines: live ? [vec(grad)] : [] },
    { id: 'upd', stage: TrainingStage.Update, title: 'W ← W − η·∇W', lines: [`η = ${fmt(v.lr)}`] },
  ];
  const edges: ChartEdge[] = [
    { from: 'corpus', to: 'example' },
    { from: 'example', to: 'hid', label: 'embed → xₜ' },
    { from: 'emb', to: 'hid' },
    { from: 'wxh', to: 'hid' },
    // The recurrence: the hidden state feeds back into itself each step.
    { from: 'whh', to: 'hid' },
    { from: 'hid', to: 'hid', label: 'hₜ₋₁ (recurrence)', dashed: true },
    { from: 'hid', to: 'prob', label: 'h_N' },
    { from: 'why', to: 'prob' },
    { from: 'prob', to: 'grad', label: 'p − y' },
    { from: 'grad', to: 'upd', label: 'BPTT → −η·∇' },
    // The update flows back into the weights for the next step.
    { from: 'upd', to: 'wxh', label: 'new W_xh', dashed: true },
    { from: 'upd', to: 'whh', label: 'new W_hh', dashed: true },
    { from: 'upd', to: 'why', label: 'new W_hy', dashed: true },
    { from: 'upd', to: 'emb', label: 'new E', dashed: true },
  ];

  return assembleFlowChart(nodes, edges, hidden);
}
