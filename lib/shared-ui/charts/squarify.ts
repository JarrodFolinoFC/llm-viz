// The classic squarified-treemap layout (Bruls, Huizing & van Wijk, 2000):
// pack areas into a rectangle preferring near-square cells so areas stay easy
// to compare. Dependency-free — the apps' inputs are flat lists, not deep
// hierarchies, so d3 would be overkill. This one algorithm previously lived,
// copy-pasted, in cost-control, super-tracker AND seek-jobs.

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Aspect ratio of the worst (least square) cell in a row, given the areas laid
// along a strip of length `side`. Lower is better.
function worst(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/**
 * Lay `areas` (already scaled to the same units as the box's area, sorted
 * descending) into `box`, returning one {@link Box} per area in input order.
 */
export function squarify(areas: number[], box: Box): Box[] {
  const out: Box[] = [];
  let { x, y, w, h } = box;
  let start = 0;

  while (start < areas.length) {
    const side = Math.min(w, h);
    const row = [areas[start]];
    let end = start + 1;
    // Grow the row while doing so keeps the cells more square.
    while (end < areas.length && worst([...row, areas[end]], side) <= worst(row, side)) {
      row.push(areas[end]);
      end++;
    }

    const rowArea = row.reduce((a, b) => a + b, 0);
    if (w <= h) {
      // Row runs horizontally along the top of the remaining box.
      const rowH = rowArea / w;
      let rx = x;
      for (const a of row) {
        const rw = a / rowH;
        out.push({ x: rx, y, w: rw, h: rowH });
        rx += rw;
      }
      y += rowH;
      h -= rowH;
    } else {
      // Row runs vertically down the left of the remaining box.
      const rowW = rowArea / h;
      let ry = y;
      for (const a of row) {
        const rh = a / rowW;
        out.push({ x, y: ry, w: rowW, h: rh });
        ry += rh;
      }
      x += rowW;
      w -= rowW;
    }
    start = end;
  }
  return out;
}

export interface WeightedItem {
  /** Area weight — items with `value <= 0` are dropped. */
  value: number;
}

/**
 * Convenience wrapper for callers with domain objects rather than raw areas:
 * drops non-positive values, sorts descending, scales values so the areas fill
 * `width × height` exactly, and returns each surviving item with its box.
 */
export function squarifyItems<T extends WeightedItem>(
  items: T[],
  width: number,
  height: number,
): (T & Box)[] {
  const live = items.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (live.length === 0 || width <= 0 || height <= 0) return [];

  const total = live.reduce((s, d) => s + d.value, 0);
  const scale = (width * height) / total;
  const boxes = squarify(
    live.map((d) => d.value * scale),
    { x: 0, y: 0, w: width, h: height },
  );
  return live.map((item, i) => ({ ...item, ...boxes[i] }));
}
