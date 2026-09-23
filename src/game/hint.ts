import type { Placements } from './placement';
import { validateBag } from './rules';
import { solve } from './solver';
import type { ItemInstance, LevelDef, Placement } from './types';

export type Hint = { kind: 'remove'; uid: string } | { kind: 'place'; uid: string; placement: Placement };

function samePlacement(a: Placement, b: Placement): boolean {
  return (
    a.compartmentId === b.compartmentId &&
    a.x === b.x &&
    a.y === b.y &&
    a.rotation === b.rotation &&
    a.shapeIndex === b.shapeIndex
  );
}

/**
 * The single most useful nudge: first take out a packed distractor, otherwise
 * show where one required item goes — keeping the player's good placements
 * when a solution still exists around them.
 */
export function findHint(level: LevelDef, instances: ItemInstance[], placements: Placements): Hint | null {
  const extra = instances.find((i) => i.role === 'distractor' && placements[i.uid]);
  if (extra) return { kind: 'remove', uid: extra.uid };

  const issues = validateBag(level, instances, placements);
  const troubled = new Set(issues.map((i) => i.uid));
  const keep: Placements = {};
  for (const inst of instances) {
    const p = placements[inst.uid];
    if (p && inst.role === 'required' && !troubled.has(inst.uid)) keep[inst.uid] = p;
  }

  const solution =
    solve(level, instances, { fixed: keep }).solutions[0] ?? solve(level, instances).solutions[0];
  if (!solution) return null;

  const required = instances.filter((i) => i.role === 'required');
  const pick =
    required.find((i) => !placements[i.uid]) ??
    required.find((i) => !samePlacement(placements[i.uid], solution[i.uid]));
  return pick ? { kind: 'place', uid: pick.uid, placement: solution[pick.uid] } : null;
}
