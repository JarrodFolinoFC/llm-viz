import { describe, it, expect } from 'vitest';

import { declutterLabels } from './declutterLabels';

const bounds = { center: 100, gap: 10, top: 5, bottom: 195 };

describe('declutterLabels', () => {
  it('assigns side by which half of the canvas the point sits in', () => {
    const out = declutterLabels(
      [
        { i: 0, x: 40, y: 50 }, // left of centre → label on the right
        { i: 1, x: 160, y: 50 }, // right of centre → label on the left
      ],
      bounds
    );
    expect(out.find((d) => d.i === 0)!.side).toBe('r');
    expect(out.find((d) => d.i === 1)!.side).toBe('l');
  });

  it('leaves a well-spaced label at its own y', () => {
    const [d] = declutterLabels([{ i: 0, x: 40, y: 50 }], bounds);
    expect(d.labelY).toBe(50);
  });

  it('pushes overlapping same-side labels apart by at least the gap', () => {
    const out = declutterLabels(
      [
        { i: 0, x: 40, y: 50 },
        { i: 1, x: 40, y: 52 }, // only 2px below → must be nudged to 60
      ],
      bounds
    );
    const a = out.find((d) => d.i === 0)!;
    const b = out.find((d) => d.i === 1)!;
    expect(b.labelY - a.labelY).toBeGreaterThanOrEqual(bounds.gap);
  });

  it('does not let the two sides interfere', () => {
    const out = declutterLabels(
      [
        { i: 0, x: 40, y: 50 }, // right side
        { i: 1, x: 160, y: 51 }, // left side, near in y but other column
      ],
      bounds
    );
    // Each is alone on its side, so neither moves.
    expect(out.find((d) => d.i === 0)!.labelY).toBe(50);
    expect(out.find((d) => d.i === 1)!.labelY).toBe(51);
  });

  it('shifts an overflowing column up but never above the top clamp', () => {
    const pts = Array.from({ length: 30 }, (_, i) => ({ i, x: 40, y: 190 }));
    const out = declutterLabels(pts, bounds);
    const ys = out.map((d) => d.labelY);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(bounds.top);
    // Labels remain monotonically spaced by the gap after the upward shift.
    const sorted = [...ys].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(bounds.gap - 1e-9);
    }
  });

  it('does not mutate the input points', () => {
    const input = [{ i: 0, x: 40, y: 50 }];
    declutterLabels(input, bounds);
    expect(input[0]).toEqual({ i: 0, x: 40, y: 50 });
  });
});
