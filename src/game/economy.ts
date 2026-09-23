import type { Stars } from './scoring';

// Soft currency: "düğme" (sewing buttons). Stars are never spent — they only
// accumulate and unlock decor tiers; buttons buy the decor.

export const STARTING_HINTS = 3;

/**
 * Buttons for finishing a level. First clears pay the most; replays pay a
 * little extra only for newly earned stars, plus a token amount so replaying
 * never feels wasted.
 */
export function levelReward(previousBest: number | undefined, stars: Stars): number {
  if (previousBest === undefined) return 10 + stars * 5;
  const newStars = Math.max(0, stars - previousBest);
  return 2 + newStars * 5;
}

/** Daily puzzle pays a bit more, and a little extra for keeping a streak. */
export function dailyPuzzleReward(stars: Stars, streak: number): number {
  return 15 + stars * 5 + Math.min(streak, 7) * 2;
}

export interface DailyReward {
  buttons: number;
  hints: number;
}

/**
 * The 7-day reward strip. Missing a day never resets it — the strip just
 * waits (no streak pressure). After day 7 it starts over.
 */
export const DAILY_REWARDS: DailyReward[] = [
  { buttons: 20, hints: 0 },
  { buttons: 0, hints: 1 },
  { buttons: 30, hints: 0 },
  { buttons: 0, hints: 2 },
  { buttons: 40, hints: 0 },
  { buttons: 20, hints: 1 },
  { buttons: 60, hints: 2 },
];

/** Local calendar day as "YYYY-MM-DD" (device time zone). */
export function dayKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Whole days between two day keys (b - a). */
export function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}
