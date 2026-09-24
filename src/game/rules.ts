import { buildOccupancy, findCompartment, placedCells, type Placements } from './placement';
import { cellKey } from './shapes';
import type { ItemInstance, LevelDef, Placement, Subject } from './types';

export type Issue =
  /** A required item is still on the desk. */
  | { kind: 'missing'; uid: string; subject?: Subject }
  /** A distractor was packed. */
  | { kind: 'extra'; uid: string }
  /** Resting in a forbidden rotation (lunchbox tipped over, bottle upside down). */
  | { kind: 'orientation'; uid: string }
  /** Something sits on top of a fragile item. */
  | { kind: 'fragile'; uid: string; crushedBy: string }
  /** Pocket-only item in the wrong compartment. */
  | { kind: 'pocket'; uid: string }
  /** A surprise item just showed up (raised by the game store, not the rules). */
  | { kind: 'surprise'; uid: string };

/** Rule checks for a single packed item that don't depend on its neighbours. */
function itemIssues(level: LevelDef, inst: ItemInstance, p: Placement): Issue[] {
  const issues: Issue[] = [];
  const allowed = inst.def.allowedRotations;
  if (allowed && !allowed.includes(p.rotation)) {
    issues.push({ kind: 'orientation', uid: inst.uid });
  }
  if (inst.def.pocket) {
    const comp = findCompartment(level, p.compartmentId);
    if (comp?.kind !== inst.def.pocket) issues.push({ kind: 'pocket', uid: inst.uid });
  }
  return issues;
}

/**
 * Items crushing a fragile item: anything occupying a cell directly above one
 * of its top cells, in the same compartment.
 */
function fragileIssues(instances: ItemInstance[], placements: Placements): Issue[] {
  const occ = buildOccupancy(instances, placements);
  const issues: Issue[] = [];
  for (const inst of instances) {
    const p = placements[inst.uid];
    if (!inst.def.fragile || !p) continue;
    const grid = occ[p.compartmentId] ?? {};
    const cells = placedCells(inst, p);
    const own = new Set(cells.map((c) => cellKey(c.x, c.y)));
    const crushers = new Set<string>();
    for (const c of cells) {
      for (let y = c.y - 1; y >= 0; y--) {
        const k = cellKey(c.x, y);
        if (own.has(k)) break;
        const other = grid[k];
        if (other) crushers.add(other);
      }
    }
    crushers.forEach((by) => issues.push({ kind: 'fragile', uid: inst.uid, crushedBy: by }));
  }
  return issues;
}

/** Everything that keeps the zipper from closing. Empty array = bag closes. */
export function validateBag(level: LevelDef, instances: ItemInstance[], placements: Placements): Issue[] {
  const issues: Issue[] = [];
  for (const inst of instances) {
    const p = placements[inst.uid];
    if (!p) {
      if (inst.role === 'required') {
        issues.push({ kind: 'missing', uid: inst.uid, subject: inst.def.subject });
      }
      continue;
    }
    if (inst.role === 'distractor') {
      issues.push({ kind: 'extra', uid: inst.uid });
      continue;
    }
    issues.push(...itemIssues(level, inst, p));
  }
  const packedRequired = instances.filter((i) => i.role === 'required' && placements[i.uid]);
  issues.push(...fragileIssues(packedRequired, placements));
  return issues;
}

/** Placement-level rule check used by the solver (no missing/extra checks). */
export function placementBreaksRules(level: LevelDef, inst: ItemInstance, p: Placement): boolean {
  return itemIssues(level, inst, p).length > 0;
}
