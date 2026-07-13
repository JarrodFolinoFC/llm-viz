import { useCorpusTrainer } from 'mlblocks';
import { StageShell } from 'mlblocks';
import { misclassifiedMetric } from 'mlblocks';
import { trigramStrategy, initTrigram } from '../../../training/strategies/trigram';
import { trainingBlocks } from 'mlblocks/core';
import { TrigramFlow } from './TrigramFlow';
import { TrigramViewModel } from './TrigramViewModel';

interface TrigramFlowContainerProps {
  vocab: readonly string[];
  corpus: string;
}

export function TrigramFlowContainer({ vocab, corpus }: TrigramFlowContainerProps) {
  const { controller, vm, prep, floors } = useCorpusTrainer({
    corpus,
    vocab,
    prepare: (c, v) => ({ examples: trainingBlocks(c, v, 2) }),
    contextLen: 2,
    strategy: trigramStrategy,
    init: (seed) => initTrigram(seed, vocab.length),
    defaults: { seed: 1, lr: 0.5 },
    viewModel: ({ prep, result }) =>
      new TrigramViewModel({ vocab, corpus, blocks: prep.examples }, result),
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
      params={[{ label: 'W', dims: [vocab.length, vocab.length, vocab.length] }]}
    >
      <TrigramFlow trainer={vm} />
    </StageShell>
  );
}
