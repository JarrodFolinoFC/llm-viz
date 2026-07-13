import { TrigramFlowContainer } from '../components/stages/trigram/TrigramFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from './../lib/corpora.ts';

/**
 * Stage — Trigram (scalar): the bigram's free logit table with one more
 * conditioning token. W is V×V×V (512 parameters at V=8), shown as eight V×V
 * slices — the exponential blow-up that motivates embedding the context
 * instead of enumerating it.
 */
export function TrigramScalarPage() {
  const vocab = vocabOf(CORPUS_8);
  return <TrigramFlowContainer vocab={vocab} corpus={CORPUS_8} />;
}
