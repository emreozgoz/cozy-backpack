import { cellKey, orientedCells } from './shapes';
import type { Catalog, Cell, CompartmentDef, ItemInstance, LevelDef, Placement } from './types';

export type Placements = Record<string, Placement>;

export function createInstances(level: LevelDef, catalog: Catalog): ItemInstance[] {
  const counts: Record<string, number> = {};
  return level.items.map(({ ref, role, appearsAfter }) => {
    const def = catalog[ref];
    if (!def) throw new Error(`Level ${level.id}: unknown item "${ref}"`);
    const n = counts[ref] ?? 0;
    counts[ref] = n + 1;
    return { uid: `${ref}#${n}`, def, role, ...(appearsAfter ? { appearsAfter } : {}) };
  });
}

export function findCompartment(level: LevelDef, id: string): CompartmentDef | undefined {
  return level.bag.compartments.find((c) => c.id === id);
}

/** Absolute cells an instance covers when placed. */
export function placedCells(inst: ItemInstance, p: Placement): Cell[] {
  return orientedCells(inst.def, p).map((c) => ({ x: c.x + p.x, y: c.y + p.y }));
}

/** compartmentId → cellKey → uid of the occupying instance. */
export type Occupancy = Record<string, Record<string, string>>;

export function buildOccupancy(
  instances: ItemInstance[],
  placements: Placements,
  exceptUid?: string,
): Occupancy {
  const occ: Occupancy = {};
  for (const inst of instances) {
    const p = placements[inst.uid];
    if (!p || inst.uid === exceptUid) continue;
    const grid = (occ[p.compartmentId] ??= {});
    for (const c of placedCells(inst, p)) grid[cellKey(c.x, c.y)] = inst.uid;
  }
  return occ;
}

export function isBlocked(comp: CompartmentDef, x: number, y: number): boolean {
  return (comp.blocked ?? []).some(([bx, by]) => bx === x && by === y);
}

/**
 * Whether `inst` physically fits at `p`: inside the compartment, not on a
 * blocked cell, not overlapping another item. Rule checks (upright, fragile,
 * pocket…) happen only when zipping — see rules.ts.
 */
export function canPlace(
  level: LevelDef,
  instances: ItemInstance[],
  placements: Placements,
  inst: ItemInstance,
  p: Placement,
): boolean {
  const comp = findCompartment(level, p.compartmentId);
  if (!comp) return false;
  const occ = buildOccupancy(instances, placements, inst.uid)[p.compartmentId] ?? {};
  return placedCells(inst, p).every(
    ({ x, y }) =>
      x >= 0 &&
      y >= 0 &&
      x < comp.cols &&
      y < comp.rows &&
      !isBlocked(comp, x, y) &&
      occ[cellKey(x, y)] === undefined,
  );
}

export function usableCellCount(comp: CompartmentDef): number {
  return comp.cols * comp.rows - (comp.blocked?.length ?? 0);
}
