import {
  AD_RULES,
  initialCounters,
  rewardedLeftToday,
  shouldShowInterstitial,
  type AdCounters,
} from '@/features/monetization/adPolicy';

const T0 = Date.UTC(2026, 8, 24, 10);
const ctx = { now: T0, today: '2026-09-24', adFree: false, isDaily: false };
const veteran: AdCounters = {
  ...initialCounters,
  levelsCleared: 20,
  levelsSinceAd: 5,
  firstOpenDay: '2026-09-20',
};

describe('interstitial policy', () => {
  it('shows for a returning player after a few levels', () => {
    expect(shouldShowInterstitial(veteran, ctx)).toBe(true);
  });

  it('never shows to ad-free players or after the daily puzzle', () => {
    expect(shouldShowInterstitial(veteran, { ...ctx, adFree: true })).toBe(false);
    expect(shouldShowInterstitial(veteran, { ...ctx, isDaily: true })).toBe(false);
  });

  it('leaves new players alone: first levels and first day', () => {
    expect(shouldShowInterstitial({ ...veteran, levelsCleared: AD_RULES.graceLevels - 1 }, ctx)).toBe(false);
    expect(shouldShowInterstitial({ ...veteran, firstOpenDay: ctx.today }, ctx)).toBe(false);
  });

  it('spaces ads by levels and by time, counting rewarded ads too', () => {
    expect(shouldShowInterstitial({ ...veteran, levelsSinceAd: 2 }, ctx)).toBe(false);
    expect(shouldShowInterstitial({ ...veteran, lastInterstitialAt: T0 - 60_000 }, ctx)).toBe(false);
    expect(shouldShowInterstitial({ ...veteran, lastRewardedAt: T0 - 60_000 }, ctx)).toBe(false);
    expect(shouldShowInterstitial({ ...veteran, lastInterstitialAt: T0 - 5 * 60_000 }, ctx)).toBe(true);
  });
});

describe('rewarded cap', () => {
  it('resets every day', () => {
    const used: AdCounters = { ...initialCounters, rewardedDay: '2026-09-24', rewardedToday: 8 };
    expect(rewardedLeftToday(used, '2026-09-24')).toBe(0);
    expect(rewardedLeftToday(used, '2026-09-25')).toBe(AD_RULES.rewardedPerDay);
  });
});
