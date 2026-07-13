import { BigramScalarInference } from '../components/stages/inference/BigramScalarInference';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from './../lib/corpora.ts';

export function BigramScalarInferencePage() {
  const vocab = vocabOf(CORPUS_8);
  return <BigramScalarInference vocab={vocab} corpus={CORPUS_8} />;
}
