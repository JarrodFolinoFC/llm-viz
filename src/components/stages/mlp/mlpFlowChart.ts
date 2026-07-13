import { argmax } from 'mlblocks/core';
import { TrainingStage } from 'mlblocks';
import { assembleFlowChart, formatVec, type ChartNode, type ChartEdge } from 'mlblocks';
import type { MlpFlowView } from './MlpFlowContainer';

/**
 * Build the MLP pipeline's overview chart from the current step's view. Every
 * forward/backward quantity is the one the panels render — the hidden vector h,
 * the softmax P (with the prediction), the output gradient p − y — so the chart
 * stays in sync as you step. Stages in `hidden` drop out (with dangling edges).
 */
export function buildMlpFlowChart(
  v: MlpFlowView,
  hidden: ReadonlySet<TrainingStage>,
  precision = 2,
): string {
  const fmt = (x: number) => x.toFixed(precision);
  const vec = (xs: number[]) => formatVec(xs, precision);

  const ctx = v.context.map((c) => v.vocab[c]).join(' · ') || '∅';
  const tgt = v.vocab[v.target] ?? '?';
  const V = v.vocab.length;
  const d = v.E[0]?.length ?? 0;
  const D = v.W1.length;
  const H = v.W1[0]?.length ?? 0;

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
    { id: 'w1', stage: TrainingStage.Parameters, title: 'W₁', lines: [`${D}×${H}`] },
    { id: 'b1', stage: TrainingStage.Parameters, title: 'b₁', lines: [`${H}`] },
    { id: 'w2', stage: TrainingStage.Parameters, title: 'W₂', lines: [`${H}×${V}`] },
    { id: 'b2', stage: TrainingStage.Parameters, title: 'b₂', lines: [`${V}`] },
    { id: 'hid', stage: TrainingStage.Forward, title: 'h = tanh(x·W₁+b₁)', lines: live ? [vec(v.hidden)] : [] },
    {
      id: 'prob',
      stage: TrainingStage.Forward,
      title: 'P = softmax(h·W₂+b₂)',
      lines: live
        ? [vec(probs), `prediction: ${predicted} ${hit ? '✓' : `✗ (target ${tgt})`}`]
        : ['(untrained — take a step)'],
    },
    { id: 'grad', stage: TrainingStage.Backprop, title: '∂L/∂logits = p − y', lines: live ? [vec(grad)] : [] },
    { id: 'upd', stage: TrainingStage.Update, title: 'W ← W − η·∇W', lines: [`η = ${fmt(v.lr)}`] },
  ];
  const edges: ChartEdge[] = [
    { from: 'corpus', to: 'example' },
    { from: 'example', to: 'hid', label: 'embed → x' },
    { from: 'emb', to: 'hid' },
    { from: 'w1', to: 'hid' },
    { from: 'b1', to: 'hid' },
    { from: 'hid', to: 'prob', label: 'h' },
    { from: 'w2', to: 'prob' },
    { from: 'b2', to: 'prob' },
    { from: 'prob', to: 'grad', label: 'p − y' },
    { from: 'grad', to: 'upd', label: '−η·∇' },
    // The update flows back into the weights for the next step.
    { from: 'upd', to: 'w1', label: 'new W₁', dashed: true },
    { from: 'upd', to: 'b1', label: 'new b₁', dashed: true },
    { from: 'upd', to: 'w2', label: 'new W₂', dashed: true },
    { from: 'upd', to: 'b2', label: 'new b₂', dashed: true },
    { from: 'upd', to: 'emb', label: 'new E', dashed: true },
  ];

  return assembleFlowChart(nodes, edges, hidden);
}
