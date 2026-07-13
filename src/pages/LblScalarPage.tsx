import { LblFlowContainer } from '../components/stages/lbl/LblFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from './../lib/corpora.ts';

/**
 * Stage — Log-bilinear (scalar): the Bengio MLP with the hidden layer deleted.
 * Embed the N context tokens, concatenate, and project straight to logits
 * (ℓ = x·W + b) — each logit a bilinear form in the context embeddings and W's
 * output column, i.e. the log-bilinear family (Mnih & Hinton 2007). Sits
 * between the trigram table (nothing shared between contexts) and the MLP
 * (nonlinear hidden layer): contexts share structure through E, but combine
 * purely linearly. 40 parameters vs the trigram's 512.
 */
export function LblScalarPage() {
  const vocab = vocabOf(CORPUS_8);
  return <LblFlowContainer vocab={vocab} corpus={CORPUS_8} />;
}
