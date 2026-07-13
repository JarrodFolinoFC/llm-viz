import { registerParams } from 'mlblocks';

/**
 * This app's tensor vocabulary, registered with mlblocks' open param registry
 * — the union across every model: bigram (W), vector (E, U), MLP (E, W₁, b₁,
 * W₂, b₂) and the RNN (E, Wxh, Whh, bh, Why, by). Imported for its side effect
 * in every entrypoint that renders flows (main.tsx, tests/setup.ts, the
 * storybook preview). Colours may repeat across models — only one model's
 * tensors are ever on screen at a time.
 */
export type LlmTensor =
  | 'E' | 'U' | 'W'
  | 'W1' | 'b1' | 'W2' | 'b2'
  | 'Wxh' | 'Whh' | 'bh' | 'Why' | 'by';

registerParams([
  // shared / bigram
  ['E', { label: 'E', color: '#0EA5E9' }],
  ['U', { label: 'U', color: '#06B6D4' }],
  ['W', { label: 'W', color: '#6366F1' }],
  // MLP
  ['W1', { label: 'W₁', color: '#4169E1' }],
  ['b1', { label: 'b₁', color: '#14B8A6' }],
  ['W2', { label: 'W₂', color: '#8B5CF6' }],
  ['b2', { label: 'b₂', color: '#F59E0B' }],
  // RNN
  ['Wxh', { label: 'Wxh', color: '#4169E1' }],
  ['Whh', { label: 'Whh', color: '#8B5CF6' }],
  ['bh', { label: 'bh', color: '#14B8A6' }],
  ['Why', { label: 'Why', color: '#EC4899' }],
  ['by', { label: 'by', color: '#F59E0B' }],
]);
