import { computeLayout, itemPixelSize } from '@/board/layout';
import { catalog } from '@/data/catalog';
import { allLevels } from '@/data/levels';
import { createInstances } from '@/game/placement';

// Board areas (width × height below the header) for real devices.
const devices = [
  ['iPhone SE', 375, 520],
  ['iPhone 16 Pro Max', 440, 740],
  ['iPad 11"', 834, 1010],
  ['iPad 13"', 1032, 1180],
] as const;

describe.each(devices)('%s board layout', (_name, width, height) => {
  it.each(allLevels().map((l) => [l.id, l] as const))('%s fits and nothing overlaps', (_id, level) => {
    const instances = createInstances(level, catalog);
    const orient = Object.fromEntries(instances.map((i) => [i.uid, { rotation: 0 as const, shapeIndex: 0 }]));
    const L = computeLayout(width, height, level, instances, orient);

    // the bag stays on screen and above the desk
    expect(L.bag.x).toBeGreaterThanOrEqual(0);
    expect(L.bag.x + L.bag.w).toBeLessThanOrEqual(width);
    expect(L.bag.y).toBeGreaterThanOrEqual(0);
    expect(L.bag.y + L.bag.h).toBeLessThanOrEqual(L.desk.y);

    // every desk item has a slot inside the desk, and slots don't overlap
    const boxes = instances.map((inst) => {
      const { w, h } = itemPixelSize(inst, orient[inst.uid], L.cell * L.deskScale);
      const c = L.deskSlots[inst.uid];
      expect(c).toBeDefined();
      return { x0: c.x - w / 2, x1: c.x + w / 2, y0: c.y - h / 2, y1: c.y + h / 2 };
    });
    for (const b of boxes) {
      expect(b.x0).toBeGreaterThanOrEqual(0);
      expect(b.x1).toBeLessThanOrEqual(width);
      expect(b.y0).toBeGreaterThanOrEqual(L.desk.y);
      expect(b.y1).toBeLessThanOrEqual(height);
    }
    boxes.forEach((a, i) =>
      boxes.slice(i + 1).forEach((b) => {
        const overlap = a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;
        expect(overlap).toBe(false);
      }),
    );
  });

  it('uses bigger cells on iPad', () => {
    const level = allLevels()[0];
    const instances = createInstances(level, catalog);
    const orient = Object.fromEntries(instances.map((i) => [i.uid, { rotation: 0 as const, shapeIndex: 0 }]));
    const { cell } = computeLayout(width, height, level, instances, orient);
    if (width >= 700) expect(cell).toBeGreaterThan(68);
    else expect(cell).toBeLessThanOrEqual(68);
  });
});
