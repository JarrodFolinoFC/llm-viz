import { useMemo } from 'react';

import { rnnStrategy, initRnn, forwardPass, type RnnModel } from '../../../training/strategies/rnn';
import { trainingBlocks } from 'mlblocks/core';
import { pretrain } from 'mlblocks/core';
import { HiddenLayer } from './HiddenLayer';
import { InferenceShell, useInference } from './InferenceShell';

// The "pretrained" RNN: trained to convergence once, up front.
const SEED = 42;
const LR = 0.3;
const EPOCHS = 2000;

/** Next-token logits from the RNN read-out after the recurrence over the context. */
const rnnLogits = (model: RnnModel, ctx: number[]) => forwardPass(model, ctx).logits;

interface RnnInferenceProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d (1 for the scalar variant). */
  dim: number;
  /** Context length N — how many steps the recurrence unrolls. */
  blockSize: number;
  /** Hidden state width H. */
  hiddenSize: number;
}

/**
 * Inference on a pretrained Elman RNN (used for both the vector and scalar
 * pages, the latter with d=1). Pick the N-token context and the decoding knobs;
 * the panels show the read-only pass — the recurrence folds each token into the
 * hidden state, then h_N reads out to logits → softmax → next token — and the
 * generation the recurrence unrolls into (greedy or sampled).
 */
export function RnnInference(props: RnnInferenceProps) {
  // Key on the model shape: changing it remounts the screen, so useInference's
  // context state re-seeds at the new block size instead of going stale.
  return <RnnInferenceScreen key={`${props.dim}-${props.blockSize}-${props.hiddenSize}`} {...props} />;
}

function RnnInferenceScreen({ vocab, corpus, dim, blockSize, hiddenSize }: RnnInferenceProps) {
  const blocks = useMemo(() => trainingBlocks(corpus, vocab, blockSize), [corpus, vocab, blockSize]);
  // Train once — stands in for loading a checkpoint.
  const model = useMemo(
    () => pretrain(rnnStrategy, initRnn(SEED, vocab.length, dim, hiddenSize), blocks, LR, EPOCHS),
    [vocab.length, dim, hiddenSize, blocks],
  );

  const initial = useMemo(
    () => blocks[0]?.context ?? Array.from({ length: blockSize }, () => 0),
    [blocks, blockSize],
  );
  const inference = useInference(vocab, model, rnnLogits, initial);
  const t1 = inference.decoding.temperature === 1;

  // The displayed panel replays the recurrence on the selected context: its
  // final pre-activation/state pair is the read-out's input.
  const fwd = forwardPass(model, inference.context);

  return (
    <InferenceShell
      vocab={vocab}
      inference={inference}
      logitLabel={t1 ? 'x = h_N·W_hy+b_y' : 'x = (h_N·W_hy+b_y)/T'}
      softmaxSubtitle={<>— softmax of the read-out logits</>}
    >
      <HiddenLayer
        z1={fwd.zs[fwd.zs.length - 1] ?? []}
        hidden={fwd.hN}
        formula={'h_N = \\tanh(x_N W_{xh} + h_{N-1} W_{hh} + b_h)'}
        zLabel="z_N"
        hLabel="h_N = tanh(z_N)"
      />
    </InferenceShell>
  );
}
