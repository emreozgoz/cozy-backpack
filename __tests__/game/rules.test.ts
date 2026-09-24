import { catalog } from '@/data/catalog';
import { canPlace, createInstances, type Placements } from '@/game/placement';
import { validateBag } from '@/game/rules';
import { starsFor } from '@/game/scoring';
import type { LevelDef, Placement } from '@/game/types';

const at = (
  x: number,
  y: number,
  rotation: Placement['rotation'] = 0,
  compartmentId = 'main',
): Placement => ({
  compartmentId,
  x,
  y,
  rotation,
  shapeIndex: 0,
});

function level(
  items: LevelDef['items'],
  cols = 4,
  rows = 4,
  extra: LevelDef['bag']['compartments'] = [],
): LevelDef {
  return {
    id: 'test',
    week: 1,
    day: 'mon',
    schedule: ['math'],
    bag: { type: 'backpack', compartments: [{ id: 'main', kind: 'main', cols, rows }, ...extra] },
    items,
  };
}

describe('canPlace', () => {
  const lvl = level([
    { ref: 'book_math', role: 'required' },
    { ref: 'pencil_case', role: 'required' },
  ]);
  const [book, pencil] = createInstances(lvl, catalog);

  it('accepts an item inside the bag', () => {
    expect(canPlace(lvl, [book, pencil], {}, book, at(0, 0))).toBe(true);
  });

  it('rejects items sticking out of the bag', () => {
    expect(canPlace(lvl, [book, pencil], {}, book, at(3, 0))).toBe(false);
    expect(canPlace(lvl, [book, pencil], {}, book, at(0, 2))).toBe(false);
  });

  it('rejects overlap but ignores the item itself', () => {
    const placed: Placements = { [book.uid]: at(0, 0) };
    expect(canPlace(lvl, [book, pencil], placed, pencil, at(0, 2))).toBe(false);
    expect(canPlace(lvl, [book, pencil], placed, pencil, at(0, 3))).toBe(true);
    expect(canPlace(lvl, [book, pencil], placed, book, at(1, 0))).toBe(true);
  });

  it('respects blocked cells', () => {
    const blocked = {
      ...lvl,
      bag: {
        ...lvl.bag,
        compartments: [{ ...lvl.bag.compartments[0], blocked: [[1, 1]] as [number, number][] }],
      },
    };
    expect(canPlace(blocked, [book, pencil], {}, book, at(0, 0))).toBe(false);
  });
});

describe('validateBag', () => {
  it('reports missing required items and packed distractors', () => {
    const lvl = level([
      { ref: 'book_math', role: 'required' },
      { ref: 'toy_car', role: 'distractor' },
    ]);
    const [book, car] = createInstances(lvl, catalog);
    const issues = validateBag(lvl, [book, car], { [car.uid]: at(2, 0) });
    expect(issues).toEqual([
      { kind: 'missing', uid: book.uid, subject: 'math' },
      { kind: 'extra', uid: car.uid },
    ]);
  });

  it('closes when everything required is packed and nothing else', () => {
    const lvl = level([
      { ref: 'book_math', role: 'required' },
      { ref: 'toy_car', role: 'distractor' },
    ]);
    const [book, car] = createInstances(lvl, catalog);
    expect(validateBag(lvl, [book, car], { [book.uid]: at(0, 0) })).toEqual([]);
  });

  it('keeps the lunchbox upright and the bottle not upside down', () => {
    const lvl = level([
      { ref: 'lunchbox', role: 'required' },
      { ref: 'water_bottle', role: 'required' },
    ]);
    const [box, bottle] = createInstances(lvl, catalog);
    const kinds = (p: Placements) => validateBag(lvl, [box, bottle], p).map((i) => i.kind);
    expect(kinds({ [box.uid]: at(0, 0), [bottle.uid]: at(3, 0) })).toEqual([]);
    expect(kinds({ [box.uid]: at(0, 0, 90), [bottle.uid]: at(3, 0) })).toEqual(['orientation']);
    expect(kinds({ [box.uid]: at(0, 0), [bottle.uid]: at(3, 0, 180) })).toEqual(['orientation']);
    expect(kinds({ [box.uid]: at(0, 0), [bottle.uid]: at(0, 3, 90) })).toEqual([]);
  });

  it('does not let anything rest on the gift', () => {
    const lvl = level([
      { ref: 'gift', role: 'required' },
      { ref: 'pencil_case', role: 'required' },
    ]);
    const [gift, pencil] = createInstances(lvl, catalog);
    expect(validateBag(lvl, [gift, pencil], { [gift.uid]: at(0, 2), [pencil.uid]: at(0, 0) })).toEqual([
      { kind: 'fragile', uid: gift.uid, crushedBy: pencil.uid },
    ]);
    expect(validateBag(lvl, [gift, pencil], { [gift.uid]: at(0, 0), [pencil.uid]: at(0, 3) })).toEqual([]);
  });

  it('keeps pocket items in their pocket', () => {
    const lvl = level([{ ref: 'permission_slip', role: 'required' }], 4, 4, [
      { id: 'front', kind: 'front', cols: 2, rows: 1 },
    ]);
    const [slip] = createInstances(lvl, catalog);
    expect(validateBag(lvl, [slip], { [slip.uid]: at(0, 0) })).toEqual([{ kind: 'pocket', uid: slip.uid }]);
    expect(validateBag(lvl, [slip], { [slip.uid]: at(1, 0, 0, 'front') })).toEqual([]);
  });

  it('keeps the laptop in its sleeve and liquids in the clear pouch', () => {
    const lvl = level(
      [
        { ref: 'laptop', role: 'required' },
        { ref: 'shampoo', role: 'required' },
      ],
      6,
      4,
      [
        { id: 'sleeve', kind: 'sleeve', cols: 3, rows: 2 },
        { id: 'pouch', kind: 'pouch', cols: 2, rows: 2 },
      ],
    );
    const [laptop, shampoo] = createInstances(lvl, catalog);
    const wrong = { [laptop.uid]: at(0, 0), [shampoo.uid]: at(0, 0, 0, 'sleeve') };
    expect(validateBag(lvl, [laptop, shampoo], wrong)).toEqual([
      { kind: 'pocket', uid: laptop.uid },
      { kind: 'pocket', uid: shampoo.uid },
    ]);
    const right = { [laptop.uid]: at(0, 0, 0, 'sleeve'), [shampoo.uid]: at(0, 0, 0, 'pouch') };
    expect(validateBag(lvl, [laptop, shampoo], right)).toEqual([]);
  });
});

describe('starsFor', () => {
  it('rewards accuracy, not speed', () => {
    expect(starsFor(0, 0)).toBe(3);
    expect(starsFor(1, 0)).toBe(2);
    expect(starsFor(0, 1)).toBe(2);
    expect(starsFor(1, 1)).toBe(1);
    expect(starsFor(5, 3)).toBe(1);
  });
});
