import { bounds, orientedCells } from '@/game/shapes';
import type { ItemInstance, LevelDef, Orientation, Placement } from '@/game/types';

export interface Point {
  x: number;
  y: number;
}

/** Where an item wants to rest: its center and scale (1 = true bag size). */
export interface Target extends Point {
  scale: number;
}

export interface CompartmentFrame {
  id: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
}

export interface BoardLayout {
  width: number;
  height: number;
  cell: number;
  compartments: CompartmentFrame[];
  /** Outer frame of the bag body, drawn around the grids. */
  bag: { x: number; y: number; w: number; h: number };
  /** Zipper track: pull tab travels from x0 to x1 along y. */
  zip: { x0: number; x1: number; y: number };
  desk: { y: number; h: number };
  deskScale: number;
  deskSlots: Record<string, Point>;
}

const GUTTER = 16;
/** Largest cell size: roomy on phones, bigger on iPad so the bag fills the screen. */
const maxCell = (width: number) => (width >= 700 ? 104 : 68);
const POCKET_GAP = 0.6; // in cells

/**
 * Pure layout math for the play board. The main compartment is centered in
 * the upper part; pockets sit to its right. The desk fills the lower part and
 * shows every item (placed ones keep their slot so the desk never reshuffles).
 */
export function computeLayout(
  width: number,
  height: number,
  level: LevelDef,
  instances: ItemInstance[],
  orient: Record<string, Orientation>,
): BoardLayout {
  const bagAreaH = height * 0.6;
  const main = level.bag.compartments.find((c) => c.kind === 'main') ?? level.bag.compartments[0];
  const pockets = level.bag.compartments.filter((c) => c !== main);
  const pocketCols = pockets.length ? Math.max(...pockets.map((p) => p.cols)) + POCKET_GAP : 0;
  const pocketRows = pockets.reduce((n, p) => n + p.rows + POCKET_GAP, 0);

  const colsTotal = main.cols + pocketCols;
  const rowsTotal = Math.max(main.rows, pocketRows);
  const bagPad = 0.45; // bag fabric around the grid, in cells
  const zipStrip = 0.8; // zipper band on top, in cells
  const handle = 0.6; // carry handle above the bag, in cells
  const cell = Math.floor(
    Math.min(
      (width - GUTTER * 2) / (colsTotal + bagPad * 2),
      (bagAreaH - GUTTER) / (rowsTotal + bagPad * 2 + zipStrip + handle),
      maxCell(width),
    ),
  );

  const gridW = colsTotal * cell;
  const gridH = rowsTotal * cell;
  const above = (bagPad + zipStrip + handle) * cell;
  const totalH = gridH + above + bagPad * cell;
  const gx = (width - gridW) / 2;
  const gy = (bagAreaH - totalH) / 2 + above;

  const compartments: CompartmentFrame[] = [{ id: main.id, x: gx, y: gy, cols: main.cols, rows: main.rows }];
  let py = gy;
  for (const p of pockets) {
    compartments.push({
      id: p.id,
      x: gx + (main.cols + POCKET_GAP) * cell,
      y: py,
      cols: p.cols,
      rows: p.rows,
    });
    py += (p.rows + POCKET_GAP) * cell;
  }

  const bag = {
    x: gx - bagPad * cell,
    y: gy - (bagPad + zipStrip) * cell,
    w: gridW + bagPad * 2 * cell,
    h: gridH + (bagPad * 2 + zipStrip) * cell,
  };

  const zip = {
    x0: bag.x + cell * 0.55,
    x1: bag.x + bag.w - cell * 0.55,
    y: bag.y + (zipStrip * cell) / 2 + cell * 0.08,
  };

  const desk = { y: bagAreaH, h: height - bagAreaH };
  const { scale: deskScale, slots: deskSlots } = layoutDesk(width, desk, cell, instances, orient);

  return { width, height, cell, compartments, bag, zip, desk, deskScale, deskSlots };
}

function layoutDesk(
  width: number,
  desk: { y: number; h: number },
  cell: number,
  instances: ItemInstance[],
  orient: Record<string, Orientation>,
): { scale: number; slots: Record<string, Point> } {
  const gap = 14;
  const sizes = instances.map((inst) => bounds(orientedCells(inst.def, orient[inst.uid])));

  for (let scale = 0.8; scale >= 0.3; scale -= 0.05) {
    const c = cell * scale;
    const rows: { items: number[]; w: number; h: number }[] = [];
    let row = { items: [] as number[], w: 0, h: 0 };
    sizes.forEach((s, i) => {
      const w = s.w * c;
      if (row.items.length && row.w + gap + w > width - GUTTER * 2) {
        rows.push(row);
        row = { items: [], w: 0, h: 0 };
      }
      row.w += (row.items.length ? gap : 0) + w;
      row.h = Math.max(row.h, s.h * c);
      row.items.push(i);
    });
    rows.push(row);
    const totalH = rows.reduce((n, r) => n + r.h, 0) + gap * (rows.length - 1);
    if (totalH > desk.h - GUTTER * 2 && scale > 0.31) continue;

    const slots: Record<string, Point> = {};
    let y = desk.y + (desk.h - totalH) / 2;
    for (const r of rows) {
      let x = (width - r.w) / 2;
      for (const i of r.items) {
        const s = sizes[i];
        slots[instances[i].uid] = { x: x + (s.w * c) / 2, y: y + r.h / 2 };
        x += s.w * c + gap;
      }
      y += r.h + gap;
    }
    return { scale, slots };
  }
  return { scale: 0.3, slots: {} };
}

export function itemPixelSize(inst: ItemInstance, o: Orientation, cell: number) {
  const b = bounds(orientedCells(inst.def, o));
  return { w: b.w * cell, h: b.h * cell, cols: b.w, rows: b.h };
}

export function targetFor(
  layout: BoardLayout,
  inst: ItemInstance,
  o: Orientation,
  placement: Placement | undefined,
): Target {
  if (placement) {
    const frame = layout.compartments.find((c) => c.id === placement.compartmentId);
    if (frame) {
      const { w, h } = itemPixelSize(inst, o, layout.cell);
      return {
        x: frame.x + placement.x * layout.cell + w / 2,
        y: frame.y + placement.y * layout.cell + h / 2,
        scale: 1,
      };
    }
  }
  const slot = layout.deskSlots[inst.uid] ?? { x: layout.width / 2, y: layout.desk.y + layout.desk.h / 2 };
  return { ...slot, scale: layout.deskScale };
}

/**
 * Which compartment cell an item's top-left would snap to, given its
 * top-left in board pixels. Null when the item's center is outside every
 * compartment (i.e. it was dropped on the desk).
 */
export function snapCell(
  layout: BoardLayout,
  left: number,
  top: number,
  size: { w: number; h: number },
): { compartmentId: string; x: number; y: number } | null {
  const cx = left + size.w / 2;
  const cy = top + size.h / 2;
  const margin = layout.cell * 0.5;
  for (const f of layout.compartments) {
    const inside =
      cx >= f.x - margin &&
      cx <= f.x + f.cols * layout.cell + margin &&
      cy >= f.y - margin &&
      cy <= f.y + f.rows * layout.cell + margin;
    if (inside) {
      return {
        compartmentId: f.id,
        x: Math.round((left - f.x) / layout.cell),
        y: Math.round((top - f.y) / layout.cell),
      };
    }
  }
  return null;
}
