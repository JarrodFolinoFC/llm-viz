// Vertical de-collision for the scatter's point labels. Labels sit to the right
// of points left of centre and to the left of points right of centre; within
// each side they are pushed apart so they never overlap, then nudged back up if
// the column overflows the bottom edge. Pure layout maths — no SVG — so the
// fiddly stacking logic can be unit-tested directly.

export interface LabelInput {
  /** Projected screen position of the point the label annotates. */
  x: number;
  y: number;
}

export interface PlacedLabel {
  /** Which side of its point the label is drawn on. */
  side: 'l' | 'r';
  /** The de-collided vertical position for the label text. */
  labelY: number;
}

export interface DeclutterBounds {
  /** Pixel x of the canvas centre — decides each label's side. */
  center: number;
  /** Minimum vertical gap between two labels on the same side. */
  gap: number;
  /** Top clamp for labels (smallest allowed labelY). */
  top: number;
  /** Bottom clamp for labels (largest allowed labelY before a shift-up). */
  bottom: number;
}

/**
 * Assign each point a `side` and a non-overlapping `labelY`. Points keep their
 * exact dot position; only the label text is moved. Returns a new array (inputs
 * are not mutated), preserving the caller's order.
 */
export function declutterLabels<T extends LabelInput>(
  pts: T[],
  { center, gap, top, bottom }: DeclutterBounds
): (T & PlacedLabel)[] {
  const placed = pts.map((p) => ({ ...p, side: (p.x < center ? 'r' : 'l') as 'l' | 'r', labelY: 0 }));

  for (const sideKey of ['r', 'l'] as const) {
    const group = placed.filter((d) => d.side === sideKey).sort((a, b) => a.y - b.y);
    // Push each label down to at least `gap` below the previous one.
    let prevY = -Infinity;
    for (const d of group) {
      d.labelY = Math.max(d.y, prevY + gap);
      prevY = d.labelY;
    }
    // If the column ran past the bottom edge, shift the whole stack up, clamped
    // to the top edge (keeping the gap as labels pile against the ceiling).
    const last = group[group.length - 1];
    if (last && last.labelY > bottom) {
      const shift = last.labelY - bottom;
      let floor = top;
      for (const d of group) {
        d.labelY = Math.max(floor, d.labelY - shift);
        floor = d.labelY + gap;
      }
    }
  }

  return placed;
}
