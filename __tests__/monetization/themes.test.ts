import { DEFAULT_ROOM } from '@/data/decor';
import { effectiveRoom, effectiveSkin, usePlayerStore } from '@/store/usePlayerStore';
import { useShopStore } from '@/store/useShopStore';

jest.mock('@/store/storage', () => {
  const mem = new Map<string, string>();
  return {
    kvStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
  };
});
jest.mock('@/features/monetization/ads', () => ({
  createAdService: () => ({
    mode: 'mock',
    prepare: async () => {},
    showInterstitial: async () => false,
    showRewarded: async () => false,
    privacyOptionsRequired: async () => false,
    showPrivacyOptions: async () => {},
  }),
}));

const player = () => usePlayerStore.getState();
const shop = () => useShopStore.getState();

beforeEach(async () => {
  player().resetProgress();
  useShopStore.setState({ entitlements: { vip: false, noAds: false, themes: [] }, granted: [] });
  await shop().init('2026-09-20');
});

describe('theme packs', () => {
  it('unlock their bag pattern and decor for good', async () => {
    expect(player().ownedDecor).not.toContain('rug_leaf');
    await shop().buy('cb.theme.autumn');
    expect(player().ownedDecor).toEqual(expect.arrayContaining(['curtain_autumn', 'rug_leaf']));
    expect(player().ownedSkins).toContain('autumn');
    expect(shop().entitlements.themes).toEqual(['autumn']);
    player().equipDecor('rug_leaf');
    expect(player().room.rug).toBe('rug_leaf');
  });

  it('the bundle unlocks both packs', async () => {
    await shop().buy('cb.theme.bundle');
    expect(player().ownedSkins).toEqual(expect.arrayContaining(['autumn', 'candy']));
  });

  it('theme decor never becomes a buttons purchase', () => {
    player().addButtons(1000);
    expect(player().buyDecor('rug_leaf')).toBe(false);
  });
});

describe('VIP themes', () => {
  it('are usable while VIP lasts and fall back to defaults after', () => {
    player().equipDecor('rug_moon'); // not VIP yet: ignored
    expect(player().room.rug).toBe(DEFAULT_ROOM.rug);
    player().equipDecor('rug_moon', true);
    player().equipSkin('starry', true);
    const { room, ownedDecor, bagSkin, ownedSkins } = player();
    expect(effectiveRoom(room, ownedDecor, true).rug).toBe('rug_moon');
    expect(effectiveSkin(bagSkin, ownedSkins, true)).toBe('starry');
    // subscription ended
    expect(effectiveRoom(room, ownedDecor, false).rug).toBe(DEFAULT_ROOM.rug);
    expect(effectiveSkin(bagSkin, ownedSkins, false)).toBe('peach');
  });
});

describe('earnable bag pattern', () => {
  it('needs stars and buttons', () => {
    player().addButtons(500);
    expect(player().buySkin('sky')).toBe(false); // 0 stars
    for (const l of [
      'w01-d1',
      'w01-d2',
      'w01-d3',
      'w01-d4',
      'w01-d5',
      'w02-d1',
      'w02-d2',
      'w02-d3',
      'w02-d4',
      'w02-d5',
    ])
      player().completeLevel(l, 3);
    expect(player().buySkin('sky')).toBe(true);
    expect(player().bagSkin).toBe('sky');
  });
});

describe('restoring purchases', () => {
  it('brings theme packs back from the store', () => {
    // what RevenueCat would report after a restore on a new phone
    useShopStore.setState({ entitlements: { vip: false, noAds: false, themes: [] } });
    player().unlockThemes(['sweets']);
    expect(player().ownedDecor).toEqual(expect.arrayContaining(['wall_cupcake', 'lamp_candy']));
  });
});
