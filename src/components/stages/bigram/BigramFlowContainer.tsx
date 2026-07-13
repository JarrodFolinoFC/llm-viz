import { randomMatrix } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import { bigramStrategy } from '../../../training/strategies/bigram';
import { corpusStats } from 'mlblocks/core';
import { useCorpusTrainer } from 'mlblocks';
import { BigramFlow } from './BigramFlow';
import { BigramViewModel } from './BigramViewModel';
import { StageShell } from 'mlblocks';
import { DIST_ERROR_EXPLAIN } from 'mlblocks';

interface BigramFlowContainerProps {
  vocab: readonly string[];
  corpus: string;
}

export function BigramFlowContainer({ vocab, corpus }: BigramFlowContainerProps) {
  const { controller, vm, floors } = useCorpusTrainer({
    corpus,
    vocab,
    prepare: (c, v) => {
      const { pairs, empirical } = corpusStats(c, v);
      return { examples: pairs, empirical };
    },
    contextLen: 1,
    strategy: bigramStrategy,
    init: (seed): Matrix => randomMatrix(seed, vocab.length, vocab.length, 1),
    defaults: { seed: 1, lr: 0.5 },
    viewModel: ({ prep, result, lr, modelHistory, precision }) =>
      new BigramViewModel(
        { vocab, corpus, pairs: prep.examples, empirical: prep.empirical },
        result, lr, modelHistory, precision,
      ),
  });

  return (
    <StageShell
      controller={controller}
      scope={vm.scope}
      vocab={vocab}
      examplesLength={vm.examplesLength}
      meanLoss={vm.meanLoss}
      metric={{ label: 'dist. error', value: vm.distError, explain: DIST_ERROR_EXPLAIN }}
      floors={floors}
      params={[{ label: 'W', dims: [vocab.length, vocab.length] }]}
    >
      <BigramFlow trainer={vm} />
    </StageShell>
  );
}
