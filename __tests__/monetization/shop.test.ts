import { STARTING_HINTS } from '@/game/economy';
import { starterOffered, useShopStore } from '@/store/useShopStore';
import { usePlayerStore } from '@/store/usePlayerStore';

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

const mockInterstitial = jest.fn(async () => true);
const mockRewarded = jest.fn(async () => true);
jest.mock('@/features/monetization/ads', () => ({
  createAdService: () => ({
    mode: 'mock',
    prepare: async () => {},
    showInterstitial: () => mockInterstitial(),
    showRewarded: () => mockRewarded(),
    privacyOptionsRequired: async () => false,
    showPrivacyOptions: async () => {},
  }),
}));

const shop = () => useShopStore.getState();
const player = () => usePlayerStore.getState();

beforeEach(async () => {
  player().resetProgress();
  useShopStore.setState({
    entitlements: { vip: false, noAds: false, themes: [] },
    granted: [],
    counters: {
      ...shop().counters,
      levelsCleared: 0,
      levelsSinceAd: 0,
      firstOpenDay: null,
      lastInterstitialAt: null,
      lastRewardedAt: null,
      rewardedToday: 0,
      rewardedDay: null,
    },
    vipHintsDay: null,
  });
  mockInterstitial.mockClear();
  mockRewarded.mockClear();
  await shop().init('2026-09-20');
});

describe('purchases (mock store)', () => {
  it('shows fallback prices and runs in mock mode without keys', () => {
    expect(shop().mode).toBe('mock');
    expect(shop().prices['cb.removeads']).toBe('$3.99');
  });

  it('adds hints for every hint pack bought', async () => {
    expect(await shop().buy('cb.hints.10')).toBe('ok');
    expect(await shop().buy('cb.hints.10')).toBe('ok');
    expect(player().hints).toBe(STARTING_HINTS + 20);
  });

  it('remove-ads turns ads off and gives its bonus only once', async () => {
    await shop().buy('cb.removeads');
    await shop().buy('cb.removeads');
    expect(shop().entitlements.noAds).toBe(true);
    expect(player().hints).toBe(STARTING_HINTS + 10);
  });

  it('starter pack: offered for the first days, then gone once bought', async () => {
    expect(starterOffered(shop(), '2026-09-21')).toBe(true);
    expect(starterOffered(shop(), '2026-09-25')).toBe(false);
    await shop().buy('cb.starter');
    expect(player().buttons).toBe(150);
    expect(starterOffered(shop(), '2026-09-21')).toBe(false);
  });

  it('keeps remove-ads forever but lets VIP ad-free end with the subscription', async () => {
    await shop().buy('cb.vip.monthly');
    expect(shop().entitlements.noAds).toBe(true);
    // the store reports the subscription has lapsed
    useShopStore.setState({ entitlements: { vip: false, noAds: false, themes: [] } });
    expect(shop().entitlements.noAds).toBe(false);
    await shop().buy('cb.removeads');
    expect(shop().entitlements.noAds).toBe(true);
  });

  it('VIP gives daily hints once a day', async () => {
    expect(shop().claimVipHints('2026-09-21')).toBe(0);
    await shop().buy('cb.vip.yearly');
    expect(shop().entitlements).toMatchObject({ vip: true, noAds: true });
    expect(shop().claimVipHints('2026-09-21')).toBe(3);
    expect(shop().claimVipHints('2026-09-21')).toBe(0);
  });
});

describe('ads', () => {
  it('interstitials follow the gentle policy', async () => {
    for (let i = 0; i < 9; i++) shop().noteLevelCleared(false);
    await shop().maybeShowInterstitial(false);
    // first open was 2026-09-20; "today" in the store is the real date, so the
    // grace day is over and 9 levels have been cleared
    expect(mockInterstitial).toHaveBeenCalledTimes(1);
    expect(shop().counters.levelsSinceAd).toBe(0);
    shop().noteLevelCleared(false);
    await shop().maybeShowInterstitial(false);
    expect(mockInterstitial).toHaveBeenCalledTimes(1); // too soon
  });

  it('never interrupts ad-free players', async () => {
    for (let i = 0; i < 12; i++) shop().noteLevelCleared(false);
    await shop().buy('cb.removeads');
    await shop().maybeShowInterstitial(false);
    expect(mockInterstitial).not.toHaveBeenCalled();
  });

  it('counts mockRewarded ads', async () => {
    expect(await shop().watchRewarded()).toBe(true);
    expect(shop().counters.rewardedToday).toBe(1);
  });
});
