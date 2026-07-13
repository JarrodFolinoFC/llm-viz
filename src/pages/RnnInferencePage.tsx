import { RnnInference } from '../components/stages/inference/RnnInference';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_22 } from '../lib/corpora';

export function RnnInferencePage() {
  const vocab = vocabOf(CORPUS_22);
  return <RnnInference vocab={vocab} corpus={CORPUS_22} dim={3} blockSize={3} hiddenSize={6} />;
}
