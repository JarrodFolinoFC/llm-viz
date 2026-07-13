import { RnnFlowContainer } from '../components/stages/rnn/RnnFlowContainer';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_22 } from '../lib/corpora';

/**
 * Stage — RNN (vector): the same Elman recurrent network as the scalar page, only
 * with multi-dimensional token embeddings (d=3) trained on the 22-token corpus.
 * The recurrence → read-out → BPTT → update pipeline is unchanged; each token is
 * now a vector the recurrence folds into the hidden state — the richer
 * representation, mirroring how the MLP page lifts its scalar variant to vectors.
 */
export function RnnPage() {
  const vocab = vocabOf(CORPUS_22);
  return <RnnFlowContainer vocab={vocab} corpus={CORPUS_22} dim={3} blockSize={3} hiddenSize={6} />;
}
