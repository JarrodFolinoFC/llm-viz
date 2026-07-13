import { MlpFlowContainer } from '../components/stages/mlp/MlpFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_22 } from '../lib/corpora';

/**
 * Stage 3 — the Bengio MLP language model. The previous N tokens are embedded,
 * concatenated, and pushed through a tanh hidden layer and an output projection;
 * softmax + cross-entropy and backprop close the loop. The next rung after the
 * scalar and vector bigrams, on the way to attention.
 */
export function MlpPage() {
  const vocab = vocabOf(CORPUS_22);
  return <MlpFlowContainer vocab={vocab} corpus={CORPUS_22} dim={3} blockSize={3} hiddenSize={8} />;
}
