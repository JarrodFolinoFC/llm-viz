import { describe, it, expect, beforeEach } from 'vitest';

import { loadHiddenStages, saveHiddenStages } from 'mlblocks';
import { TrainingStage } from 'mlblocks';

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    document.cookie = `${c.split('=')[0].trim()}=; max-age=0; path=/`;
  }
}

beforeEach(clearCookies);

describe('stage filter cookie', () => {
  it('round-trips a page\'s hidden stages', () => {
    expect(loadHiddenStages('/mlp/training').size).toBe(0);
    saveHiddenStages('/mlp/training', new Set([TrainingStage.Backprop, TrainingStage.Update]));
    const restored = loadHiddenStages('/mlp/training');
    expect(restored.has(TrainingStage.Backprop)).toBe(true);
    expect(restored.has(TrainingStage.Update)).toBe(true);
    expect(restored.size).toBe(2);
  });

  it('keeps pages independent', () => {
    saveHiddenStages('/mlp/training', new Set([TrainingStage.Backprop]));
    saveHiddenStages('/bigram/training/scalar', new Set([TrainingStage.Parameters]));
    expect([...loadHiddenStages('/mlp/training')]).toEqual([TrainingStage.Backprop]);
    expect([...loadHiddenStages('/bigram/training/scalar')]).toEqual([TrainingStage.Parameters]);
  });

  it('clears a page\'s entry once nothing is hidden', () => {
    saveHiddenStages('/mlp/training', new Set([TrainingStage.Backprop]));
    saveHiddenStages('/mlp/training', new Set());
    expect(loadHiddenStages('/mlp/training').size).toBe(0);
  });
});
