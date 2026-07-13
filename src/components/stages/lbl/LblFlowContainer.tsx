import { useCorpusTrainer } from 'mlblocks';
import { StageShell } from 'mlblocks';
import { misclassifiedMetric } from 'mlblocks';
import { lblStrategy, initLbl } from '../../../training/strategies/lbl';
import { trainingBlocks } from 'mlblocks/core';
import { LblFlow } from './LblFlow';
import { LblViewModel } from './LblViewModel';

interface LblFlowContainerProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d (1 for the scalar page). */
  dim?: number;
  /** Context block size N. */
  blockSize?: number;
}

export function LblFlowContainer({ vocab, corpus, dim = 1, blockSize = 3 }: LblFlowContainerProps) {
  const { controller, vm, prep, floors } = useCorpusTrainer({
    corpus,
    vocab,
    prepare: (c, v) => ({ examples: trainingBlocks(c, v, blockSize) }),
    prepareDeps: [blockSize],
    contextLen: blockSize,
    strategy: lblStrategy,
    init: (seed) => initLbl(seed, vocab.length, dim, blockSize),
    defaults: { seed: 1, lr: 0.3 },
    viewModel: ({ prep, result, lr }) =>
      new LblViewModel({ vocab, corpus, blocks: prep.examples, blockSize }, result, lr),
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
        { label: 'W', dims: [blockSize * dim, vocab.length] },
        { label: 'b', dims: [vocab.length] },
      ]}
    >
      <LblFlow trainer={vm} />
    </StageShell>
  );
}
