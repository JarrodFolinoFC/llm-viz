import { argmax } from 'mlblocks/core';
import { TrainingStage } from 'mlblocks';
import { assembleFlowChart, formatVec, type ChartNode, type ChartEdge } from 'mlblocks';
import type { BigramViewModel } from './BigramViewModel';

/**
 * Build the scalar-bigram pipeline's overview chart from the current step's view.
 * The probabilities, gradient and update delta are the same numbers the
 * RowSoftmax / GradientUpdate panels show, so the chart tracks
 * them as you step. Stages in `hidden` drop out (with any dangling edge).
 */
export function buildBigramFlowChart(
  v: BigramViewModel,
  hidden: ReadonlySet<TrainingStage>,
  precision = 2,
): string {
  const vec = (xs: number[]) => formatVec(xs, precision);
  const V = v.vocab.length;
  const prev = v.currentPair.prev;
  const target = v.currentPair.target;

  const probs = v.softmaxRows.map((r) => r[2]);
  const grad = v.gradientRows.map((r) => r[2]);
  const delta = v.updateRows.map((r) => r[1]);
  const predictedIdx = argmax(probs);
  const predicted = v.vocab[predictedIdx] ?? '?';
  const hit = predictedIdx === target;
  // Before the first step nothing has been computed — the panels show hints, so
  // the chart must not display live-looking values either.
  const live = v.step > 0;

  const nodes: ChartNode[] = [
    { id: 'corpus', stage: TrainingStage.Data, title: 'Training corpus', lines: [`${V}-word vocab`] },
    {
      id: 'example',
      stage: TrainingStage.Data,
      title: 'Example',
      lines: [`prev: ${v.vocab[prev] ?? '?'}`, `target: ${v.vocab[target] ?? '?'}`],
    },
    { id: 'w', stage: TrainingStage.Parameters, title: 'W (weight table)', lines: [`${V}×${V}`] },
    {
      id: 'prob',
      stage: TrainingStage.Forward,
      title: 'P = softmax(W[prev])',
      lines: live
        ? [vec(probs), `prediction: ${predicted} ${hit ? '✓' : `✗ (target ${v.vocab[target] ?? '?'})`}`]
        : ['(untrained — take a step)'],
    },
    { id: 'grad', stage: TrainingStage.Backprop, title: '∂L/∂x = p − y', lines: live ? [vec(grad)] : [] },
    { id: 'upd', stage: TrainingStage.Update, title: 'W[prev] ← W[prev] − η·grad', lines: live ? [vec(delta)] : [] },
  ];
  const edges: ChartEdge[] = [
    { from: 'corpus', to: 'example' },
    { from: 'example', to: 'prob', label: 'prev → row' },
    { from: 'w', to: 'prob' },
    { from: 'prob', to: 'grad', label: 'p − y' },
    { from: 'grad', to: 'upd', label: '−η·grad' },
    // The updated row flows back into the weight table for the next step.
    { from: 'upd', to: 'w', label: 'new W', dashed: true },
  ];

  return assembleFlowChart(nodes, edges, hidden);
}
