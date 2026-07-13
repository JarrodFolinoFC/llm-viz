import { BigramFlowContainer } from '../components/stages/bigram/BigramFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from './../lib/corpora.ts';

export function BigramPage() {
  const vocab = vocabOf(CORPUS_8);
  return <BigramFlowContainer vocab={vocab} corpus={CORPUS_8} />;
}
