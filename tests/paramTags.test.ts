import { describe, it, expect } from 'vitest';

import { tensorsInSpec } from 'mlblocks';
import { bigramFlowSpec } from '../src/components/stages/bigram/BigramFlow';
import { vectorFlowSpec } from '../src/components/stages/vector/VectorFlow';
import { rnnFlowSpec } from '../src/components/stages/rnn/RnnFlow';
import { mlpFlowSpec, mlpScalarFlowSpec } from '../src/components/stages/mlp/MlpFlow';

/**
 * Each model tags its panels with the tensors they involve; `tensorsInSpec`
 * collects them (ordered by PARAM_ORDER) to drive the Parameters filter group.
 * These assert the per-model parameter sets — the source of truth the filter
 * bar renders from — so a missing or wrong tag is caught here, not in the UI.
 */
describe('per-model parameter tags', () => {
  it('bigram exposes just W', () => {
    expect(tensorsInSpec(bigramFlowSpec)).toEqual(['W']);
  });

  it('vector exposes E and U', () => {
    expect(tensorsInSpec(vectorFlowSpec)).toEqual(['E', 'U']);
  });

  it('the RNN exposes E and its four weight/bias tensors, in pipeline order', () => {
    expect(tensorsInSpec(rnnFlowSpec)).toEqual(['E', 'Wxh', 'Whh', 'bh', 'Why', 'by']);
  });

  it('the MLP exposes E, W₁, b₁, W₂, b₂', () => {
    expect(tensorsInSpec(mlpFlowSpec)).toEqual(['E', 'W1', 'b1', 'W2', 'b2']);
  });

  it('the MLP scalar layout tags the same set (companions inherit their panel)', () => {
    expect(tensorsInSpec(mlpScalarFlowSpec)).toEqual(['E', 'W1', 'b1', 'W2', 'b2']);
  });
});
