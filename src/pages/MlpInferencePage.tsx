import { MlpInference } from '../components/stages/inference/MlpInference';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_22 } from '../lib/corpora';

export function MlpInferencePage() {
  const vocab = vocabOf(CORPUS_22);
  return <MlpInference vocab={vocab} corpus={CORPUS_22} dim={3} blockSize={3} hiddenSize={8} />;
}
