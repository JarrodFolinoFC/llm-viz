import { RnnInference } from '../components/stages/inference/RnnInference';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from '../lib/corpora';

// Scalar variant: 1-d token embeddings, otherwise the same Elman RNN setup as
// the main RNN inference page (3-token context, 6 hidden units).
export function RnnScalarInferencePage() {
  const vocab = vocabOf(CORPUS_8);
  return <RnnInference vocab={vocab} corpus={CORPUS_8} dim={1} blockSize={3} hiddenSize={6} />;
}
