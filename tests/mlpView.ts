import { initMlp, mlpStrategy } from '../src/training/strategies/mlp';
import { trainingBlocks } from 'mlblocks/core';
import { StepTrainer } from 'mlblocks/core';
import { CORPUS_22 } from '../src/lib/corpora';
import { MlpViewModel } from '../src/components/stages/mlp/MlpViewModel';

/**
 * Build a realistic post-step {@link MlpViewModel} the way MlpFlowContainer
 * does — one training step on CORPUS_22 (seed 1, lr 0.3). The view-model is
 * the REAL derivation (not a hand-mirrored copy), so tests exercise exactly
 * what the container renders.
 */
export function buildMlpView(): MlpViewModel {
  const vocab = [...new Set(CORPUS_22.split(' '))];
  const blocks = trainingBlocks(CORPUS_22, vocab, 3);
  const model = initMlp(1, vocab.length, 3, 3, 8);
  const result = new StepTrainer(blocks, 0, model, mlpStrategy).doStep(1, 0.3);
  return new MlpViewModel({ vocab, corpus: CORPUS_22, blocks, blockSize: 3 }, result, 0.3);
}

/** The vocab CORPUS_22 induces, for tests that need to name words. */
export const MLP_TEST_VOCAB = [...new Set(CORPUS_22.split(' '))];
