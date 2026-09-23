import { DECOR } from '@/data/decor';
import { en } from '@/i18n/en';
import { tr } from '@/i18n/tr';

jest.mock('@/store/usePlayerStore', () => ({ usePlayerStore: jest.fn() }));

describe('translations', () => {
  it.each([
    ['tr', tr],
    ['en', en],
  ] as const)('%s names every decor item', (_lang, dict) => {
    for (const d of DECOR) expect(dict.decor[d.id]).toBeTruthy();
    expect(Object.keys(dict.decor).sort()).toEqual(DECOR.map((d) => d.id).sort());
  });

  it('keeps the same keys in both languages', () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' ? keys(v).map((c) => `${k}.${c}`) : [k],
      );
    expect(keys(en).sort()).toEqual(keys(tr).sort());
  });
});
