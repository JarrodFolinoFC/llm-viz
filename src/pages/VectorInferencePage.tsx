import { VectorInference } from '../components/stages/inference/VectorInference';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_16 } from './../lib/corpora.ts';

export function VectorInferencePage({ dim }: { dim: number }) {
  const vocab = vocabOf(CORPUS_16);
  return <VectorInference vocab={vocab} corpus={CORPUS_16} dim={dim} />;
}
