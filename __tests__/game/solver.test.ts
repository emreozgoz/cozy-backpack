import { catalog } from '@/data/catalog';
import { allLevels } from '@/data/levels';
import { findHint } from '@/game/hint';
import { createInstances } from '@/game/placement';
import { validateBag } from '@/game/rules';
import { solve } from '@/game/solver';

describe('solver', () => {
  it.each(allLevels().map((l) => [l.id, l] as const))('solves %s', (_id, level) => {
    const instances = createInstances(level, catalog);
    const { solutions } = solve(level, instances);
    expect(solutions).toHaveLength(1);
    expect(validateBag(level, instances, solutions[0])).toEqual([]);
  });

  it('knows level 3 cannot be packed without rotating', () => {
    const level = allLevels().find((l) => l.id === 'w01-d3')!;
    const instances = createInstances(level, catalog);
    expect(solve(level, instances, { allowRotation: false }).solutions).toHaveLength(0);
  });
});

describe('findHint', () => {
  const level = allLevels()[0];
  const instances = createInstances(level, catalog);

  it('suggests a placement that is part of a real solution', () => {
    const hint = findHint(level, instances, {});
    expect(hint?.kind).toBe('place');
  });

  it('asks to remove a packed distractor first', () => {
    const lvl = { ...level, items: [...level.items, { ref: 'toy_car', role: 'distractor' as const }] };
    const inst = createInstances(lvl, catalog);
    const car = inst.find((i) => i.def.id === 'toy_car')!;
    const hint = findHint(lvl, inst, {
      [car.uid]: { compartmentId: 'main', x: 0, y: 0, rotation: 0, shapeIndex: 0 },
    });
    expect(hint).toEqual({ kind: 'remove', uid: car.uid });
  });

  it('returns nothing once the bag is correctly packed', () => {
    const { solutions } = solve(level, instances);
    expect(findHint(level, instances, solutions[0])).toBeNull();
  });
});
