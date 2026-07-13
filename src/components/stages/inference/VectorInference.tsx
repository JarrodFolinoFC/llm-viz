import { useMemo } from 'react';

import { vocabIndex, randomMatrix, trainingPairs, dot } from 'mlblocks/core';
import { embeddingStrategy, type EmbeddingModel } from '../../../training/strategies/embedding';
import { pretrain } from 'mlblocks/core';
import { FormulaDisplay } from 'mlblocks';
import { EmbeddingTable } from './EmbeddingTable';
import { InferenceShell, useInference } from './InferenceShell';

// The "pretrained" embedding bigram: E and U trained to convergence once, up front.
const SEED = 42;
const LR = 0.5;
const EPOCHS = 1000;

/** Next-token logits: e_a · u_b for every b (a = the current token). */
const vectorLogits = ({ E, U }: EmbeddingModel, ctx: number[]) =>
  U.map((u) => dot(E[ctx[ctx.length - 1]], u));

interface VectorInferenceProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d. */
  dim?: number;
}

/**
 * Inference on a pretrained vector ("embedding") bigram. The logit for the next
 * token b is the dot product of the current token's embedding e_a and b's
 * unembedding u_b — so the whole next-token distribution is softmax(e_a · Uᵀ).
 * Pick the current token and the decoding knobs; the panels show E, U, the
 * dot-product logits → softmax → next token → generation. Read-only: the
 * embeddings never change.
 */
export function VectorInference({ vocab, corpus, dim = 2 }: VectorInferenceProps) {
  const V = vocab.length;
  const pairs = useMemo(() => trainingPairs(corpus, vocab), [corpus, vocab]);
  // Train once — stands in for loading a checkpoint.
  const model = useMemo(
    () =>
      pretrain(
        embeddingStrategy,
        { E: randomMatrix(SEED, V, dim, 1), U: randomMatrix(SEED + 1, V, dim, 1) },
        pairs,
        LR,
        EPOCHS,
      ),
    [V, dim, pairs],
  );
  const { E, U } = model;
  const idx = useMemo(() => vocabIndex(vocab), [vocab]);

  const inference = useInference(vocab, model, vectorLogits, [idx.get('the') ?? 0]);
  const t1 = inference.decoding.temperature === 1;

  return (
    <InferenceShell
      vocab={vocab}
      inference={inference}
      logitLabel={t1 ? 'x = eₐ·u' : 'x = eₐ·u/T'}
      softmaxSubtitle={<>— softmax of the dot-product logits</>}
    >
      <EmbeddingTable
        title={<><FormulaDisplay inline latex="E" /> — token embeddings</>}
        vocab={vocab}
        matrix={E}
        highlightRow={inference.current}
      />
      <EmbeddingTable
        title={<><FormulaDisplay inline latex="U" /> — unembeddings</>}
        vocab={vocab}
        matrix={U}
      />
    </InferenceShell>
  );
}
