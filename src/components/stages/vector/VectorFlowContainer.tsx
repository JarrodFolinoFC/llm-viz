import { useState } from 'react';
import { Flex } from 'antd';
import { Checkbox } from 'shared-ui';

import { randomMatrix } from 'mlblocks/core';
import type { Matrix } from 'mlblocks/core';
import { corpusStats } from 'mlblocks/core';
import {
  embeddingStrategy,
  tiedEmbeddingStrategy,
} from '../../../training/strategies/embedding';
import { useCorpusTrainer } from 'mlblocks';
import { space } from '../../../theme';
import { Term } from 'mlblocks';
import { VectorFlow } from './VectorFlow';
import { VectorViewModel } from './VectorViewModel';
import { StageShell } from 'mlblocks';
import { DIST_ERROR_EXPLAIN } from 'mlblocks';

interface VectorFlowContainerProps {
  vocab: readonly string[];
  corpus: string;
  /** Embedding width d. */
  dim?: number;
}

export function VectorFlowContainer({ vocab, corpus, dim = 4 }: VectorFlowContainerProps) {
  // Weight tying (U = E). Flipping swaps the strategy; useStepTrainer re-inits
  // on a strategy change, so training restarts from the seed without a remount
  // (the dock stays open). `tied` is run identity, so it rides into the
  // view-model with the trainer's output.
  const [tied, setTied] = useState(false);
  const onTiedChange = setTied;

  const { controller, vm, floors } = useCorpusTrainer({
    corpus,
    vocab,
    prepare: (c, v) => {
      const { pairs, empirical } = corpusStats(c, v);
      return { examples: pairs, empirical };
    },
    contextLen: 1,
    strategy: tied ? tiedEmbeddingStrategy : embeddingStrategy,
    // Tied: one table serves both roles (U IS E, same reference), so the
    // panels show identical e/u columns and the update moves them together.
    init: (seed): { E: Matrix; U: Matrix } => {
      const E = randomMatrix(seed, vocab.length, dim, 1);
      return tied ? { E, U: E } : { E, U: randomMatrix(seed + 1, vocab.length, dim, 1) };
    },
    defaults: { seed: 1, lr: 0.5 },
    viewModel: ({ prep, result, lr, modelHistory, precision }) =>
      new VectorViewModel(
        { vocab, corpus, pairs: prep.examples, empirical: prep.empirical },
        result, lr, modelHistory, tied, precision,
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
      params={
        tied
          ? [{ label: 'E = U (tied)', dims: [vocab.length, dim] }]
          : [
              { label: 'E', dims: [vocab.length, dim] },
              { label: 'U', dims: [vocab.length, dim] },
            ]
      }
      trainerExtras={
        <Flex gap={space.xs} align="center">
          <Checkbox checked={tied} onChange={(e) => onTiedChange(e.target.checked)}>
            <Term
              label="tie U = E"
              explain="Weight tying: one table serves as both embedding and unembedding, so logit[a][b] = e_a · e_b and both roles' gradients accumulate into the same rows (half the parameters). GPT-2 and nanoGPT tie wte and lm_head with exactly this trick — model.py: `self.transformer.wte.weight = self.lm_head.weight`. Toggling restarts training from the seed."
            />
          </Checkbox>
        </Flex>
      }
    >
      <VectorFlow trainer={vm} />
    </StageShell>
  );
}
