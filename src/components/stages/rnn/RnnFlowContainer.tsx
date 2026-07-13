import { useCorpusTrainer } from 'mlblocks';
import { StageShell } from 'mlblocks';
import { misclassifiedMetric } from 'mlblocks';
import { rnnStrategy, initRnn } from '../../../training/strategies/rnn';
import { trainingBlocks } from 'mlblocks/core';
import { RnnFlow } from './RnnFlow';
import { RnnViewModel } from './RnnViewModel';

// The raw view surface lives with the view-model; re-exported here so the
// chart module (and tests) keep their import path.
export type { RnnFlowView } from './RnnViewModel';

interface RnnFlowContainerProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d (1 for the scalar page). */
  dim?: number;
  /** Context length N — how many steps the recurrence unrolls. */
  blockSize?: number;
  /** Hidden state width H. */
  hiddenSize?: number;
}

export function RnnFlowContainer({ vocab, corpus, dim = 1, blockSize = 3, hiddenSize = 6 }: RnnFlowContainerProps) {
  const { controller, vm, prep, floors } = useCorpusTrainer({
    corpus,
    vocab,
    prepare: (c, v) => ({ examples: trainingBlocks(c, v, blockSize) }),
    prepareDeps: [blockSize],
    contextLen: blockSize,
    strategy: rnnStrategy,
    init: (seed) => initRnn(seed, vocab.length, dim, hiddenSize),
    defaults: { seed: 1, lr: 0.3 },
    viewModel: ({ prep, result, lr }) =>
      new RnnViewModel({ vocab, corpus, blocks: prep.examples, blockSize }, result, lr),
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
        { label: 'W_xh', dims: [dim, hiddenSize] },
        { label: 'W_hh', dims: [hiddenSize, hiddenSize] },
        { label: 'b_h', dims: [hiddenSize] },
        { label: 'W_hy', dims: [hiddenSize, vocab.length] },
        { label: 'b_y', dims: [vocab.length] },
      ]}
    >
      <RnnFlow trainer={vm} />
    </StageShell>
  );
}
