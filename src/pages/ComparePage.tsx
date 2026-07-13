import { useMemo } from 'react';
import { Table, Typography } from 'antd';

import { randomMatrix, trainingPairs, trainToConvergence, softmaxRow } from 'mlblocks/core';
import { vocabOf } from 'mlblocks/core';
import { CORPUS_22 } from '../lib/corpora';
import { trainingBlocks } from 'mlblocks/core';
import { lossFloors } from 'mlblocks/core';
import { pretrain } from 'mlblocks/core';
import { misclassifiedCount } from 'mlblocks';
import { bigramStrategy } from '../training/strategies/bigram';
import { embeddingStrategy, EmbeddingStrategy } from '../training/strategies/embedding';
import { mlpStrategy, initMlp, forwardPass as mlpForward } from '../training/strategies/mlp';
import { rnnStrategy, initRnn, forwardPass as rnnForward } from '../training/strategies/rnn';

const { Title, Paragraph, Text } = Typography;

// One corpus for every model, so the numbers are actually comparable.
const SEED = 42;
const BLOCK = 3;
const DIM = 3;

interface Row {
  key: string;
  model: string;
  context: string;
  params: number;
  loss: number;
  floor: number;
  perplexity: number;
  misclassified: string;
}

/**
 * Train every stage to convergence on the SAME corpus and line the results up:
 * parameters vs converged loss vs each model's floor. This is the question the
 * stage ladder begs — "did the bigger model actually help?" — answered with
 * auditable numbers. (The bigram models see 1 token of context so their floor
 * is higher; that difference IS the value of context.)
 */
function useComparison() {
  return useMemo<Row[]>(() => {
    const vocab = vocabOf(CORPUS_22);
    const V = vocab.length;
    const pairs = trainingPairs(CORPUS_22, vocab);
    const blocks = trainingBlocks(CORPUS_22, vocab, BLOCK);
    const floor1 = lossFloors(CORPUS_22, 1);
    const floorN = lossFloors(CORPUS_22, BLOCK);

    // Bigram (scalar): the free V×V table.
    const W = trainToConvergence(randomMatrix(SEED, V, V, 1), pairs, 0.5, 300);
    const bigramLoss = bigramStrategy.loss(W, pairs);
    const bigramMis = misclassifiedCount(pairs, (p) => softmaxRow(W[p.prev]));

    // Bigram (vector): E·Uᵀ at d=3. lr 0.3 — at 0.5 this model oscillates and
    // never settles (a real lr-tuning lesson, visible on its training page).
    const emb = pretrain(
      embeddingStrategy,
      { E: randomMatrix(SEED, V, DIM, 1), U: randomMatrix(SEED + 1, V, DIM, 1) },
      pairs,
      0.3,
      1000,
    );
    const embLogits = EmbeddingStrategy.logits(emb.E, emb.U);
    const embLoss = embeddingStrategy.loss(emb, pairs);
    const embMis = misclassifiedCount(pairs, (p) => embLogits[p.prev]);

    // MLP: d=3, N=3, H=8 (the MLP page's setup).
    const H = 8;
    const mlp = pretrain(mlpStrategy, initMlp(SEED, V, DIM, BLOCK, H), blocks, 0.3, 1500);
    const mlpLoss = mlpStrategy.loss(mlp, blocks);
    const mlpMis = misclassifiedCount(blocks, (b) => mlpForward(mlp, b.context).probs);

    // RNN: d=3, N=3, H=6 (the RNN page's setup). lr 0.2 — BPTT tolerates less.
    const HR = 6;
    const rnn = pretrain(rnnStrategy, initRnn(SEED, V, DIM, HR), blocks, 0.2, 2500);
    const rnnLoss = rnnStrategy.loss(rnn, blocks);
    const rnnMis = misclassifiedCount(blocks, (b) => rnnForward(rnn, b.context).probs);

    const row = (
      key: string, model: string, ctx: number, params: number,
      loss: number, floor: number, mis: number, total: number, minMis: number,
    ): Row => ({
      key,
      model,
      context: `${ctx} token${ctx > 1 ? 's' : ''}`,
      params,
      loss,
      floor,
      perplexity: Math.exp(loss),
      misclassified: `${mis} / ${total} (min ${minMis})`,
    });

    return [
      row('bigram', 'Bigram (scalar table)', 1, V * V, bigramLoss, floor1.minCrossEntropy, bigramMis, pairs.length, floor1.minMisclassified),
      row('vector', `Bigram (vector, d=${DIM})`, 1, 2 * V * DIM, embLoss, floor1.minCrossEntropy, embMis, pairs.length, floor1.minMisclassified),
      row('mlp', `MLP (d=${DIM}, H=${H})`, BLOCK, V * DIM + BLOCK * DIM * H + H + H * V + V, mlpLoss, floorN.minCrossEntropy, mlpMis, blocks.length, floorN.minMisclassified),
      row('rnn', `RNN (d=${DIM}, H=${HR})`, BLOCK, V * DIM + DIM * HR + HR * HR + HR + HR * V + V, rnnLoss, floorN.minCrossEntropy, rnnMis, blocks.length, floorN.minMisclassified),
    ];
  }, []);
}

export function ComparePage() {
  const rows = useComparison();
  return (
    <Typography style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3}>Model comparison — one corpus, four models</Title>
      <Paragraph>
        Every model below is trained to convergence on the <Text strong>same 22-token corpus</Text>{' '}
        (seed {SEED}), so the numbers are directly comparable. <Text strong>Floor</Text> is the
        corpus's conditional entropy for that model's context length — the best ANY model of that
        context could score — so read each row as "how much of its possible gap did it close?".
        The bigrams' higher floor is not a defect; it is the measurable cost of seeing only one
        token of context.
      </Paragraph>
      <Table<Row>
        dataSource={rows}
        pagination={false}
        size="small"
        columns={[
          { title: 'model', dataIndex: 'model' },
          { title: 'context', dataIndex: 'context' },
          { title: 'parameters', dataIndex: 'params', render: (v: number) => v.toLocaleString() },
          { title: 'cross-entropy', dataIndex: 'loss', render: (v: number) => v.toFixed(3) },
          { title: 'floor', dataIndex: 'floor', render: (v: number) => v.toFixed(3) },
          { title: 'perplexity', dataIndex: 'perplexity', render: (v: number) => v.toFixed(2) },
          { title: 'misclassified', dataIndex: 'misclassified' },
        ]}
      />
      <Paragraph type="secondary" style={{ marginTop: 16 }}>
        Read the gaps, not the absolute losses. The free table essentially reaches its (high,
        1-token) floor — memorisation works when you can afford V² parameters. The vector bigram
        gets almost there with a fraction of them: that's compression through the rank-{DIM}
        bottleneck of E·Uᵀ. Three tokens of context lowers the floor itself, but these tiny
        MLP/RNNs can't fully cash it in — capacity and optimisation start to bite, and the RNN
        (whose gradients squeeze through the recurrence, at a reduced lr) trains slowest of all.
        Parameters vs context vs achievable loss: this table is the scaling-laws mindset in
        miniature. (Budgets are deliberately per-model — the vector bigram diverges at the scalar's
        lr 0.5, and the RNN needs lr 0.2 — learning-rate tuning is part of the lesson.)
      </Paragraph>
    </Typography>
  );
}
