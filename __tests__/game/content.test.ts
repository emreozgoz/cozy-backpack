import items from '@/assets/data/items.json';
import { levelIndex } from '@/data/levelIndex';
import { catalogSchema, levelSchema } from '@/data/schema';

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
