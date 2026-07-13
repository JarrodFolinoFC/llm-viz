import { useMemo } from 'react';

import { mlpStrategy, initMlp, forwardPass, type MlpModel } from '../../../training/strategies/mlp';
import { trainingBlocks } from 'mlblocks/core';
import { pretrain } from 'mlblocks/core';
import { ContextEmbeddings } from './ContextEmbeddings';
import { HiddenLayer } from './HiddenLayer';
import { InferenceShell, useInference } from './InferenceShell';
import styles from './inference.module.css';

// The "pretrained" MLP: trained to convergence once, up front.
const SEED = 42;
const LR = 0.3;
const EPOCHS = 2000;

/** Next-token logits from the MLP forward pass over the context block. */
const mlpLogits = (model: MlpModel, ctx: number[]) => forwardPass(model, ctx).logits;

interface MlpInferenceProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d (1 for the scalar variant). */
  dim: number;
  /** Context block size N. */
  blockSize: number;
  /** Hidden layer width H. */
  hiddenSize: number;
}

/**
 * Inference on a pretrained Bengio MLP (used for both the vector and scalar
 * pages, the latter with d=1). Pick the N-token context and the decoding knobs;
 * the panels show the read-only forward pass — context embeddings → x → tanh
 * hidden layer → output logits → softmax → next token — then generation
 * sliding the window (greedy or sampled).
 */
export function MlpInference(props: MlpInferenceProps) {
  // Key on the model shape: changing it remounts the screen, so useInference's
  // context state re-seeds at the new block size instead of going stale.
  return <MlpInferenceScreen key={`${props.dim}-${props.blockSize}-${props.hiddenSize}`} {...props} />;
}

function MlpInferenceScreen({ vocab, corpus, dim, blockSize, hiddenSize }: MlpInferenceProps) {
  const blocks = useMemo(() => trainingBlocks(corpus, vocab, blockSize), [corpus, vocab, blockSize]);
  // Train once — stands in for loading a checkpoint.
  const model = useMemo(
    () => pretrain(mlpStrategy, initMlp(SEED, vocab.length, dim, blockSize, hiddenSize), blocks, LR, EPOCHS),
    [vocab.length, dim, blockSize, hiddenSize, blocks],
  );

  const initial = useMemo(
    () => blocks[0]?.context ?? Array.from({ length: blockSize }, () => 0),
    [blocks, blockSize],
  );
  const inference = useInference(vocab, model, mlpLogits, initial);
  const t1 = inference.decoding.temperature === 1;

  // The displayed panels replay the forward pass on the selected context.
  const fwd = forwardPass(model, inference.context);

  return (
    <InferenceShell
      vocab={vocab}
      inference={inference}
      logitLabel={t1 ? 'x = h·W₂+b₂' : 'x = (h·W₂+b₂)/T'}
      softmaxSubtitle={<>— softmax of the output logits</>}
    >
      <ContextEmbeddings vocab={vocab} context={inference.context} E={model.E} x={fwd.x} />
      <span className={styles.connector} aria-hidden>→</span>
      <HiddenLayer z1={fwd.z1} hidden={fwd.hidden} />
    </InferenceShell>
  );
}
