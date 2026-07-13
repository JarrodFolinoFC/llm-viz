import { describe, it, expect } from 'vitest';

import { StepTrainer, trainingBlocks, softmaxRow, vocabOf } from 'mlblocks/core';
import { CORPUS_8 } from '../src/lib/corpora';
import { trigramStrategy, initTrigram } from '../src/training/strategies/trigram';
import { TrigramViewModel } from '../src/components/stages/trigram/TrigramViewModel';

const vocab = vocabOf(CORPUS_8);
const blocks = trainingBlocks(CORPUS_8, vocab, 2);

const stepTo = (n: number, lr = 0.5) =>
  new StepTrainer(blocks, 0, initTrigram(1, vocab.length), trigramStrategy).doStep(n, lr);

describe('trigram strategy', () => {
  it('slices the corpus into 2-token-context blocks over the 8-word vocab', () => {
    expect(vocab).toHaveLength(8);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(b.context).toHaveLength(2);
  });

  it('one step updates exactly the trained (c, a) row of the tensor', () => {
    const result = stepTo(1);
    const { flash, W } = result;
    const before = initTrigram(1, vocab.length);
    for (let c = 0; c < vocab.length; c++) {
      for (let a = 0; a < vocab.length; a++) {
        if (c === flash!.c && a === flash!.prev) continue;
        expect(W[c][a]).toEqual(before[c][a]);
      }
    }
    // The trained row moved by −η·(p − y): target logit up, the rest down.
    const trained = W[flash!.c][flash!.prev];
    expect(trained[flash!.target]).toBeGreaterThan(flash!.prevRow[flash!.target]);
  });

  it('after − before equals −η·(p − y) on the trained row', () => {
    const lr = 0.5;
    const result = stepTo(3, lr);
    const { flash, W } = result;
    const probs = softmaxRow(flash!.prevRow);
    W[flash!.c][flash!.prev].forEach((v, i) => {
      const grad = probs[i] - (i === flash!.target ? 1 : 0);
      expect(v - flash!.prevRow[i]).toBeCloseTo(-lr * grad, 10);
    });
  });

  it('training reduces the mean cross-entropy', () => {
    const loss0 = trigramStrategy.loss(initTrigram(1, vocab.length), blocks);
    const lossN = trigramStrategy.loss(stepTo(blocks.length * 3).W, blocks);
    expect(lossN).toBeLessThan(loss0);
  });
});

describe('TrigramViewModel', () => {
  const vm = new TrigramViewModel({ vocab, corpus: CORPUS_8, blocks }, stepTo(1));

  it('exposes one slice panel per vocab token, the active one highlighted', () => {
    expect(vm.slicePanels).toHaveLength(8);
    const active = vm.slicePanels.filter((p) => p.highlightedRows!.length > 0);
    expect(active).toHaveLength(1);
    expect(active[0].phase).toContain('active slice');
  });

  it('restores the pre-step row in prevW and shows its softmax in the worked panel', () => {
    const { flash } = vm;
    expect(vm.prevW[flash!.c][flash!.prev]).toEqual(flash!.prevRow);
    const probs = softmaxRow(flash!.prevRow);
    vm.softmaxRows.forEach((row, i) => expect(row[2]).toBeCloseTo(probs[i], 10));
  });

  it('captions the softmax with the full 2-token context', () => {
    expect(vm.softmaxPanel.contextTokens).toEqual(vm.context);
    expect(vm.context).toHaveLength(2);
  });
});
