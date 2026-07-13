import { MlpInference } from '../components/stages/inference/MlpInference';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from '../lib/corpora';

// Scalar variant: 1-d token embeddings, otherwise the same Bengio MLP setup as
// the main MLP inference page (3-token context, 8 hidden units).
export function MlpScalarInferencePage() {
  const vocab = vocabOf(CORPUS_8);
  return <MlpInference vocab={vocab} corpus={CORPUS_8} dim={1} blockSize={3} hiddenSize={8} />;
}
