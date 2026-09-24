import items from '@/assets/data/items.json';
import { levelIndex } from '@/data/levelIndex';
import { drawItem } from '@/art/items';
import { KEYCHAINS } from '@/data/keychains';
import { catalogSchema, levelSchema } from '@/data/schema';
import type { BagType } from '@/game/types';

// Drawers only build element trees; Skia's components can be plain names here.
jest.mock('@shopify/react-native-skia', () => new Proxy({}, { get: (_, key) => String(key) }));

// Guards content edits made without running `npm run levels`.
describe('content files', () => {
  it('item catalog matches the schema', () => {
    expect(catalogSchema.safeParse(items).success).toBe(true);
  });

  it.each(levelIndex.map((l) => [l.id, l] as const))('%s matches the schema', (_id, level) => {
    const result = levelSchema.safeParse(level);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('keeps levels in week/day order', () => {
    const ids = levelIndex.map((l) => l.id);
    expect(ids).toEqual([...ids].sort());
  });
});

describe('bag seasons', () => {
  const seasons: [BagType, number, number][] = [
    ['backpack', 1, 6],
    ['briefcase', 7, 10],
    ['college', 11, 14],
    ['suitcase', 15, 18],
  ];

  it('has 90 days across four bag types', () => {
    expect(levelIndex).toHaveLength(90);
    for (const [type, from, to] of seasons) {
      const weeks = levelIndex.filter((l) => l.bag.type === type).map((l) => l.week);
      expect(Math.min(...weeks)).toBe(from);
      expect(Math.max(...weeks)).toBe(to);
      expect(weeks).toHaveLength((to - from + 1) * 5);
    }
  });

  it('rewards each season finale with a keychain', () => {
    const finales = KEYCHAINS.flatMap((k) => (k.goal.kind === 'level' ? [k.goal.levelId] : []));
    for (const id of ['w06-d5', 'w10-d5', 'w14-d5', 'w18-d5']) expect(finales).toContain(id);
  });

  it('draws every season item with its own art, not the generic fallback', () => {
    const ctx = { w: 112, h: 112, c: 56, base: '#A8D8F0', isDark: false, cells: [0, 1, 2, 3].map((i) => ({ x: i % 2, y: Math.floor(i / 2) })) };
    const generic = drawItem('__none__', ctx);
    const seasonal = Object.values(items).filter((d) => ['laptop', 'coffee', 'tshirt', 'souvenir', 'umbrella', 'camera'].includes(d.sprite));
    expect(seasonal).toHaveLength(6);
    for (const d of seasonal) expect(drawItem(d.sprite, ctx).face).not.toEqual(generic.face);
  });
});
