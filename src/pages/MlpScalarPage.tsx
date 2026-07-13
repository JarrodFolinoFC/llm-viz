import { MlpFlowContainer } from '../components/stages/mlp/MlpFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from '../lib/corpora';

/**
 * Stage — MLP (scalar): the same Bengio MLP training flow as the main "MLP for
 * NLP" stage, only with 1-d token embeddings (d=1). Mirrors how the scalar
 * inference page reuses {@link MlpInference} with d=1 — one pipeline, a narrower
 * embedding — so the full forward → backprop → update walkthrough comes for free.
 */
export function MlpScalarPage() {
  const vocab = vocabOf(CORPUS_8);
  return (
    <MlpFlowContainer vocab={vocab} corpus={CORPUS_8} dim={1} blockSize={3} hiddenSize={8} layout="stacked" />
  );
}
