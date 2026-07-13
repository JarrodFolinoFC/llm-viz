// Pure 3D→2D projection for the embedding scatter: pad a point to 3 dims, rotate
// it by yaw/pitch, then project onto the SVG canvas. No React, no DOM — kept
// separate from the component so the geometry is unit-testable on its own.

export type Vec3 = [number, number, number];

/** Pad a possibly-short vector (d = 2) to a 3-vector; missing axes are 0. */
export const v3 = (p: number[]): Vec3 => [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Rotate a point by yaw (about the vertical axis) then pitch (about horizontal). */
export function rotate([x, y, z]: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

/** Camera + canvas placement shared by every projected point in one render. */
export interface Projection {
  yaw: number;
  pitch: number;
  /** World→pixel scale factor. */
  scale: number;
  /** Pixel coordinate of the canvas centre (both axes). */
  center: number;
}

/** A projected point: screen x/y plus the rotated z used for depth fading. */
export interface Projected {
  x: number;
  y: number;
  depth: number;
}

/** Project a world point to screen space (y flipped so +y points up). */
export function project(p: number[], { yaw, pitch, scale, center }: Projection): Projected {
  const [x, y, z] = rotate(v3(p), yaw, pitch);
  return { x: center + x * scale, y: center - y * scale, depth: z };
}

/**
 * Depth-based opacity for 3D: nearer points (larger z) stay opaque, far points
 * fade to 0.45. Flat (2D) renders return 1 — there is no depth to convey.
 */
export function fade(depth: number, maxR: number, is3d: boolean): number {
  return is3d ? 0.45 + 0.55 * ((depth + maxR) / (2 * maxR)) : 1;
}
