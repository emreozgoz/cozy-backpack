import { isBlocked, usableCellCount, type Placements } from './placement';
import { placementBreaksRules, validateBag } from './rules';
import { cellKey, orientedCells, shapeVariants } from './shapes';
import { ROTATIONS, type ItemInstance, type LevelDef, type Placement } from './types';

export interface SolveOptions {
  /** Placements that must be kept (e.g. the player's correct items, for hints). */
  fixed?: Placements;
  /** Stop after finding this many solutions. Default 1. */
  maxSolutions?: number;
  /** When false, only rotation 0 is tried — tells us whether a level needs rotating. */
  allowRotation?: boolean;
  /** Abort after this many search nodes. */
  nodeBudget?: number;
}

export interface SolveResult {
  solutions: Placements[];
  /** True if the search space was fully explored (count is exact up to maxSolutions). */
  exhaustive: boolean;
  nodes: number;
}

/** Distinct (rotation, shapeIndex) pairs — skips rotations that yield identical cells. */
function orientations(inst: ItemInstance, allowRotation: boolean) {
  const seen = new Set<string>();
  const out: { rotation: Placement['rotation']; shapeIndex: number }[] = [];
  const variants = shapeVariants(inst.def);
  for (let shapeIndex = 0; shapeIndex < variants.length; shapeIndex++) {
    for (const rotation of allowRotation ? ROTATIONS : ([0] as const)) {
      const key = orientedCells(inst.def, { rotation, shapeIndex })
        .map((c) => cellKey(c.x, c.y))
        .sort()
        .join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ rotation, shapeIndex });
    }
  }
  return out;
}

/** Packs every required item so that the bag would zip. */
export function solve(level: LevelDef, instances: ItemInstance[], opts: SolveOptions = {}): SolveResult {
  const { maxSolutions = 1, allowRotation = true, nodeBudget = 2_000_000 } = opts;
  const fixed = opts.fixed ?? {};
  const required = instances.filter((i) => i.role === 'required');
  const todo = required
    .filter((i) => !fixed[i.uid])
    // Fragile items first: the space above them is then closed off for
    // everything else. After that, big items first (fewest choices).
    .sort(
      (a, b) =>
        Number(!!b.def.fragile) - Number(!!a.def.fragile) ||
        orientedCells(b.def, { rotation: 0, shapeIndex: 0 }).length -
          orientedCells(a.def, { rotation: 0, shapeIndex: 0 }).length,
    );

  const totalFree = level.bag.compartments.reduce((n, c) => n + usableCellCount(c), 0);
  const fixedCells = required
    .filter((i) => fixed[i.uid])
    .reduce((n, i) => n + orientedCells(i.def, fixed[i.uid]).length, 0);
  const todoCells = todo.map((i) => orientedCells(i.def, { rotation: 0, shapeIndex: 0 }).length);

  const solutions: Placements[] = [];
  const placements: Placements = { ...fixed };
  let nodes = 0;
  let aborted = false;

  // Occupancy per compartment: 0 = free, 1 = blocked or taken. Updated in
  // place while searching (much cheaper than rebuilding it every step).
  const grids = new Map(
    level.bag.compartments.map((c) => {
      const g = new Uint8Array(c.cols * c.rows);
      for (const [bx, by] of c.blocked ?? []) g[by * c.cols + bx] = 1;
      return [c.id, { c, g }] as const;
    }),
  );
  for (const inst of required) {
    const p = fixed[inst.uid];
    if (!p) continue;
    const { c, g } = grids.get(p.compartmentId)!;
    for (const k of orientedCells(inst.def, p)) g[(k.y + p.y) * c.cols + k.x + p.x] = 1;
  }

  // Every placement that stays in bounds, off blocked cells and within the
  // item's own rules — with its grid indices precomputed.
  const candidates = todo.map((inst) => {
    const list: { p: Placement; g: Uint8Array; idx: number[] }[] = [];
    for (const o of orientations(inst, allowRotation)) {
      const cells = orientedCells(inst.def, o);
      for (const { c, g } of grids.values()) {
        for (let y = 0; y < c.rows; y++) {
          for (let x = 0; x < c.cols; x++) {
            const p: Placement = { compartmentId: c.id, x, y, ...o };
            if (placementBreaksRules(level, inst, p)) continue;
            const idx: number[] = [];
            let ok = true;
            for (const k of cells) {
              const cx = k.x + x;
              const cy = k.y + y;
              if (cx >= c.cols || cy >= c.rows || isBlocked(c, cx, cy)) {
                ok = false;
                break;
              }
              idx.push(cy * c.cols + cx);
            }
            if (ok) list.push({ p, g, idx });
          }
        }
      }
    }
    return list;
  });

  /** Free cells stuck in pockets of space too small for any item still to place. */
  function wastedCells(minPiece: number): number {
    let wasted = 0;
    for (const { c, g } of grids.values()) {
      const seen = new Uint8Array(g.length);
      for (let start = 0; start < g.length; start++) {
        if (g[start] || seen[start]) continue;
        let size = 0;
        const stack = [start];
        seen[start] = 1;
        while (stack.length) {
          const i = stack.pop()!;
          size++;
          const x = i % c.cols;
          const y = (i - x) / c.cols;
          const next = [
            x > 0 ? i - 1 : -1,
            x < c.cols - 1 ? i + 1 : -1,
            y > 0 ? i - c.cols : -1,
            y < c.rows - 1 ? i + c.cols : -1,
          ];
          for (const n of next) {
            if (n >= 0 && !g[n] && !seen[n]) {
              seen[n] = 1;
              stack.push(n);
            }
          }
        }
        if (size < minPiece) wasted += size;
      }
    }
    return wasted;
  }

  /**
   * Free cells above a fragile item (same compartment), or null if one is
   * already taken. They get reserved (marked 2) so nothing lands there later.
   */
  function cellsAbove(g: Uint8Array, idx: number[], cols: number): number[] | null {
    const own = new Set(idx);
    const out = new Set<number>();
    for (const i of idx) {
      for (let j = i - cols; j >= 0; j -= cols) {
        if (own.has(j)) break;
        if (g[j] === 1) return null;
        if (g[j] === 0) out.add(j);
      }
    }
    return [...out];
  }

  function search(index: number, usedCells: number) {
    if (aborted || solutions.length >= maxSolutions) return;
    if (++nodes > nodeBudget) {
      aborted = true;
      return;
    }
    if (index === todo.length) {
      // Per-item rules were filtered up front; the fragile rule needs the full bag.
      if (validateBag(level, required, placements).length === 0) {
        solutions.push({ ...placements });
      }
      return;
    }
    let remaining = 0;
    let minPiece = Infinity;
    for (let i = index; i < todo.length; i++) {
      remaining += todoCells[i];
      minPiece = Math.min(minPiece, todoCells[i]);
    }
    const slack = totalFree - usedCells - remaining;
    if (slack < 0) return;
    if (wastedCells(minPiece) > slack) return;

    const inst = todo[index];
    for (const cand of candidates[index]) {
      const { g, idx } = cand;
      if (idx.some((i) => g[i])) continue;
      const above = inst.def.fragile ? cellsAbove(g, idx, grids.get(cand.p.compartmentId)!.c.cols) : [];
      if (above === null) continue;
      for (const i of idx) g[i] = 1;
      for (const i of above) g[i] = 2;
      placements[inst.uid] = cand.p;
      // Reserved cells count as used: nothing else may fill them.
      search(index + 1, usedCells + todoCells[index] + above.length);
      delete placements[inst.uid];
      for (const i of idx) g[i] = 0;
      for (const i of above) g[i] = 0;
      if (aborted || solutions.length >= maxSolutions) return;
    }
  }

  search(0, fixedCells);
  return { solutions, exhaustive: !aborted, nodes };
}
