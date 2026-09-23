import { canPlace, usableCellCount, type Placements } from './placement';
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
    .sort(
      (a, b) =>
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

  const candidates = todo.map((inst) => {
    const list: Placement[] = [];
    for (const o of orientations(inst, allowRotation)) {
      for (const comp of level.bag.compartments) {
        for (let y = 0; y < comp.rows; y++) {
          for (let x = 0; x < comp.cols; x++) {
            const p: Placement = { compartmentId: comp.id, x, y, ...o };
            if (!placementBreaksRules(level, inst, p)) list.push(p);
          }
        }
      }
    }
    return list;
  });

  function search(index: number, usedCells: number) {
    if (aborted || solutions.length >= maxSolutions) return;
    if (++nodes > nodeBudget) {
      aborted = true;
      return;
    }
    if (index === todo.length) {
      if (validateBag(level, required, placements).length === 0) {
        solutions.push({ ...placements });
      }
      return;
    }
    let remaining = 0;
    for (let i = index; i < todo.length; i++) remaining += todoCells[i];
    if (usedCells + remaining > totalFree) return;

    const inst = todo[index];
    for (const p of candidates[index]) {
      if (!canPlace(level, required, placements, inst, p)) continue;
      placements[inst.uid] = p;
      search(index + 1, usedCells + todoCells[index]);
      delete placements[inst.uid];
      if (aborted || solutions.length >= maxSolutions) return;
    }
  }

  search(0, fixedCells);
  return { solutions, exhaustive: !aborted, nodes };
}
