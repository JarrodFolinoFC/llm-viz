import { useCorpusTrainer } from 'mlblocks';
import { StageShell } from 'mlblocks';
import { misclassifiedMetric } from 'mlblocks';
import { mlpStrategy, initMlp } from '../../../training/strategies/mlp';
import { trainingBlocks } from 'mlblocks/core';
import { MlpFlow, type MlpFlowLayout } from './MlpFlow';
import { MlpViewModel } from './MlpViewModel';

// The raw view surface lives with the view-model; re-exported here so the
// notes / trace / chart modules (and tests) keep their import path.
export type { MlpFlowView } from './MlpViewModel';

interface MlpFlowContainerProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d. */
  dim?: number;
  /** Context block size N. */
  blockSize?: number;
  /** Hidden layer width H. */
  hiddenSize?: number;
  /** Which flow layout to render (the scalar page prototypes 'stacked'). */
  layout?: MlpFlowLayout;
}

export function MlpFlowContainer({ vocab, corpus, dim = 3, blockSize = 3, hiddenSize = 8, layout }: MlpFlowContainerProps) {
  const { controller, vm, prep, floors } = useCorpusTrainer({
    corpus,
    vocab,
    prepare: (c, v) => ({ examples: trainingBlocks(c, v, blockSize) }),
    prepareDeps: [blockSize],
    contextLen: blockSize,
    strategy: mlpStrategy,
    init: (seed) => initMlp(seed, vocab.length, dim, blockSize, hiddenSize),
    defaults: { seed: 1, lr: 0.3 },
    viewModel: ({ prep, result, lr }) =>
      new MlpViewModel({ vocab, corpus, blocks: prep.examples, blockSize }, result, lr),
  });

  return (
    <StageShell
      controller={controller}
      scope={vm.scope}
      vocab={vocab}
      examplesLength={vm.examplesLength}
      meanLoss={vm.meanLoss}
      metric={misclassifiedMetric(vm.misclassified, prep.examples.length, floors.minMisclassified)}
      floors={floors}
      params={[
        { label: 'E', dims: [vocab.length, dim] },
        { label: 'W₁', dims: [blockSize * dim, hiddenSize] },
        { label: 'b₁', dims: [hiddenSize] },
        { label: 'W₂', dims: [hiddenSize, vocab.length] },
        { label: 'b₂', dims: [vocab.length] },
      ]}
    >
      <MlpFlow trainer={vm} layout={layout} />
    </StageShell>
  );
}
