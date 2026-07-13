import { VectorFlowContainer } from '../components/stages/vector/VectorFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_16 } from './../lib/corpora.ts';

export function VectorPage({ dim }: { dim: number }) {
  const vocab = vocabOf(CORPUS_16);
  return <VectorFlowContainer vocab={vocab} corpus={CORPUS_16} dim={dim} />;
}
