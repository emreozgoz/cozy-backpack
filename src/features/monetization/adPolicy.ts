// When ads may appear — kept deliberately gentle so the game stays cozy
// (see the plan's "Reklam politikası"). Pure functions; the ad store feeds
// them its counters.

export const AD_RULES = {
  /** No interstitials until the player has finished this many levels… */
  graceLevels: 8,
  /** …and never on the day they first opened the game. */
  graceFirstDay: true,
  /** At least this many finished levels between two interstitials. */
  levelsBetween: 3,
  /** And at least this long between any two full-screen ads. */
  minGapMs: 4 * 60_000,
  /** Rewarded ads a player can choose to watch per day. */
  rewardedPerDay: 8,
} as const;

export interface AdCounters {
  /** Levels finished in total (daily puzzles excluded). */
  levelsCleared: number;
  /** Levels finished since the last interstitial. */
  levelsSinceAd: number;
  lastInterstitialAt: number | null;
  lastRewardedAt: number | null;
  firstOpenDay: string | null;
  rewardedDay: string | null;
  rewardedToday: number;
}

export interface AdContext {
  now: number;
  today: string;
  /** Remove Ads, starter pack or VIP. */
  adFree: boolean;
  /** The level just finished was the daily puzzle. */
  isDaily: boolean;
}

export function shouldShowInterstitial(c: AdCounters, ctx: AdContext): boolean {
  if (ctx.adFree || ctx.isDaily) return false;
  if (c.levelsCleared < AD_RULES.graceLevels) return false;
  if (AD_RULES.graceFirstDay && (c.firstOpenDay === null || c.firstOpenDay === ctx.today)) return false;
  if (c.levelsSinceAd < AD_RULES.levelsBetween) return false;
  // A rewarded ad the player chose to watch also counts as their "ad break".
  const last = Math.max(c.lastInterstitialAt ?? 0, c.lastRewardedAt ?? 0);
  if (last && ctx.now - last < AD_RULES.minGapMs) return false;
  return true;
}

export function rewardedLeftToday(c: AdCounters, today: string): number {
  const used = c.rewardedDay === today ? c.rewardedToday : 0;
  return Math.max(0, AD_RULES.rewardedPerDay - used);
}

export const initialCounters: AdCounters = {
  levelsCleared: 0,
  levelsSinceAd: 0,
  lastInterstitialAt: null,
  lastRewardedAt: null,
  firstOpenDay: null,
  rewardedDay: null,
  rewardedToday: 0,
};
