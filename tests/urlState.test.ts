import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { parseTrainerUrl, numParam, useUrlPatch } from 'mlblocks';
import { TrainingStage } from 'mlblocks';

const parse = (search: string) => parseTrainerUrl(new URLSearchParams(search));

describe('parseTrainerUrl', () => {
  it('is empty for a blank query', () => {
    expect(parse('')).toEqual({});
  });

  it('reads the trainer inputs', () => {
    expect(parse('seed=7&lr=0.25&shuffle=1&step=12')).toEqual({
      seed: 7,
      lr: 0.25,
      shuffle: true,
      step: 12,
    });
  });

  it('reads shuffle=0 as an explicit false', () => {
    expect(parse('shuffle=0').shuffle).toBe(false);
  });

  it('accepts a valid precision and rejects an invalid one', () => {
    expect(parse('p=4').precision).toBe(4);
    expect(parse('p=9').precision).toBeUndefined();
    expect(parse('p=abc').precision).toBeUndefined();
  });

  it('drops non-positive lr and non-integer/negative step', () => {
    expect(parse('lr=0').lr).toBeUndefined();
    expect(parse('lr=-1').lr).toBeUndefined();
    expect(parse('step=-3').step).toBeUndefined();
    expect(parse('step=2.5').step).toBeUndefined();
  });

  it('keeps only known stage ids in hide (order preserved)', () => {
    expect(parse('hide=forward,bogus,loss').hide).toEqual([
      TrainingStage.Forward,
      TrainingStage.Loss,
    ]);
    expect(parse('hide=bogus').hide).toBeUndefined();
  });
});

describe('numParam', () => {
  it('trims trailing-zero noise', () => {
    expect(numParam(0.3)).toBe('0.3');
    expect(numParam(0.30000000000000004)).toBe('0.3');
    expect(numParam(1)).toBe('1');
  });
});

describe('useUrlPatch', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/mlp/training/scalar');
  });

  it('sets non-null params and drops null ones without adding history entries', () => {
    const before = window.history.length;
    const { result } = renderHook(() => useUrlPatch());

    result.current({ step: '5', seed: null });
    expect(window.location.search).toBe('?step=5');

    // step back to default → param removed
    result.current({ step: null });
    expect(window.location.search).toBe('');

    // replaceState, not pushState: the history stack didn't grow
    expect(window.history.length).toBe(before);
  });

  it('merges into existing params, touching only its own keys', () => {
    window.history.replaceState(null, '', '/mlp/training/scalar?hide=forward');
    const { result } = renderHook(() => useUrlPatch());

    result.current({ step: '3' });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('hide')).toBe('forward');
    expect(params.get('step')).toBe('3');
  });
});
