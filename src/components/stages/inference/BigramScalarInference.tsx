import { useMemo } from 'react';

import { vocabIndex, randomMatrix, trainingPairs, trainToConvergence } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import { InferenceWeights } from './InferenceWeights';
import { InferenceShell, useInference } from './InferenceShell';

// The "pretrained" model: a V×V bigram logit table trained to convergence on the
// corpus once, up front. Inference never touches these weights — it just reads
// them. Fixed seed + epochs so the page is deterministic.
const SEED = 42;
const LR = 0.5;
const EPOCHS = 400;

/** Next-token logits: read row a of W (the current token's row). */
const bigramLogits = (W: Matrix, ctx: number[]) => W[ctx[ctx.length - 1]];

interface BigramScalarInferenceProps {
  vocab: readonly string[];
  corpus: string;
}

/**
 * Inference on a pretrained scalar bigram. There is no training loop and no
 * stepping: the model is trained once up front, you pick the current token and
 * the decoding knobs (temperature, greedy vs sample), and the panels show the
 * whole read-only pass — read row a of W → softmax → next token → the
 * generation it unrolls into.
 */
export function BigramScalarInference({ vocab, corpus }: BigramScalarInferenceProps) {
  const V = vocab.length;
  const pairs = useMemo(() => trainingPairs(corpus, vocab), [corpus, vocab]);
  // Train once — this stands in for loading a checkpoint.
  const W = useMemo(
    () => trainToConvergence(randomMatrix(SEED, V, V, 1), pairs, LR, EPOCHS),
    [V, pairs],
  );
  const idx = useMemo(() => vocabIndex(vocab), [vocab]);

  const inference = useInference(vocab, W, bigramLogits, [idx.get('the') ?? 0]);
  const t1 = inference.decoding.temperature === 1;

  return (
    <InferenceShell vocab={vocab} inference={inference} logitLabel={t1 ? 'x = Wₐ,ᵢ' : 'x = Wₐ,ᵢ/T'}>
      <InferenceWeights
        vocab={vocab}
        matrix={W}
        current={inference.current}
        predicted={inference.predicted}
      />
    </InferenceShell>
  );
}
