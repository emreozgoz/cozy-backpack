import type { Cell, ItemDef, Orientation, Rotation } from './types';

export function parseShape(rows: string[]): Cell[] {
  const cells: Cell[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'X') cells.push({ x, y });
    }
  });
  return cells;
}

export function bounds(cells: Cell[]): { w: number; h: number } {
  let w = 0;
  let h = 0;
  for (const c of cells) {
    w = Math.max(w, c.x + 1);
    h = Math.max(h, c.y + 1);
  }
  return { w, h };
}

/**
 * Rotates cells clockwise (screen coordinates, y down) inside their bounding
 * box, so the result is again anchored at (0, 0). This matches a CSS
 * `rotate(deg)` of the bounding box around its center.
 */
export function rotateCells(cells: Cell[], rotation: Rotation): Cell[] {
  let out = cells;
  for (let i = 0; i < rotation / 90; i++) {
    const { h } = bounds(out);
    out = out.map(({ x, y }) => ({ x: h - 1 - y, y: x }));
  }
  return out;
}

export function shapeVariants(def: ItemDef): string[][] {
  return [def.shape, ...(def.altShapes ?? [])];
}

/** Cells an item occupies in the given orientation, anchored at (0, 0). */
export function orientedCells(def: ItemDef, o: Orientation): Cell[] {
  const variants = shapeVariants(def);
  const shape = variants[o.shapeIndex] ?? variants[0];
  return rotateCells(parseShape(shape), o.rotation);
}

export function nextRotation(r: Rotation): Rotation {
  return ((r + 90) % 360) as Rotation;
}

/**
 * What a tap does. Rigid items turn 90° clockwise; soft items (with
 * altShapes) cycle upright → sideways through each of their fold shapes.
 */
export function nextOrientation(def: ItemDef, o: Orientation): Orientation {
  const variants = shapeVariants(def);
  if (variants.length === 1) return { rotation: nextRotation(o.rotation), shapeIndex: 0 };
  if (o.rotation === 0) return { rotation: 90, shapeIndex: o.shapeIndex };
  return { rotation: 0, shapeIndex: (o.shapeIndex + 1) % variants.length };
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}
