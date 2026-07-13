import { describe, it, expect } from 'vitest';

import { v3, clamp, rotate, project, fade, type Projection } from './geometry';

describe('v3', () => {
  it('pads short vectors with zeros', () => {
    expect(v3([])).toEqual([0, 0, 0]);
    expect(v3([1])).toEqual([1, 0, 0]);
    expect(v3([1, 2])).toEqual([1, 2, 0]);
    expect(v3([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('clamp', () => {
  it('bounds a value to [a, b]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('rotate', () => {
  it('is identity at zero yaw and pitch', () => {
    expect(rotate([1, 2, 3], 0, 0)).toEqual([1, 2, 3]);
  });

  it('rotates x into z under a quarter-turn of yaw', () => {
    const [x, y, z] = rotate([1, 0, 0], Math.PI / 2, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(-1);
  });

  it('preserves vector length (rotations are isometries)', () => {
    const [x, y, z] = rotate([1, 2, 3], 0.7, -0.35);
    expect(Math.hypot(x, y, z)).toBeCloseTo(Math.hypot(1, 2, 3));
  });
});

describe('project', () => {
  const proj: Projection = { yaw: 0, pitch: 0, scale: 10, center: 100 };

  it('places the origin at the canvas centre', () => {
    expect(project([0, 0, 0], proj)).toEqual({ x: 100, y: 100, depth: 0 });
  });

  it('flips y so +y points up the screen', () => {
    expect(project([1, 1, 0], proj)).toEqual({ x: 110, y: 90, depth: 0 });
  });
});

describe('fade', () => {
  it('is fully opaque in 2D regardless of depth', () => {
    expect(fade(-5, 5, false)).toBe(1);
  });

  it('maps near/far depth to the [0.45, 1] range in 3D', () => {
    expect(fade(5, 5, true)).toBeCloseTo(1); // nearest
    expect(fade(-5, 5, true)).toBeCloseTo(0.45); // farthest
    expect(fade(0, 5, true)).toBeCloseTo(0.725); // midpoint
  });
});
