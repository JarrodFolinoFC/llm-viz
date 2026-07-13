import { RnnFlowContainer } from '../components/stages/rnn/RnnFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from '../lib/corpora';

/**
 * Stage — RNN (scalar): an Elman recurrent network trained on the same corpus as
 * the scalar bigram/MLP stages, with 1-d token embeddings (d=1). Unlike the MLP,
 * which concatenates the whole context into one vector, the RNN folds the tokens
 * in one at a time through a recurrent hidden state — so the full recurrence →
 * read-out → BPTT → update walkthrough reads as a sequence model.
 */
export function RnnScalarPage() {
  const vocab = vocabOf(CORPUS_8);
  return <RnnFlowContainer vocab={vocab} corpus={CORPUS_8} dim={1} blockSize={3} hiddenSize={6} />;
}
