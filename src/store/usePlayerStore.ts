import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DECOR, DEFAULT_ROOM, decorById, newlyUnlocked, type DecorItem, type DecorSlot } from '@/data/decor';
import { allLevels } from '@/data/levels';
import {
  DAILY_REWARDS,
  STARTING_HINTS,
  dailyPuzzleReward,
  daysBetween,
  levelReward,
  type DailyReward,
} from '@/game/economy';
import type { Stars } from '@/game/scoring';

import { kvStorage } from './storage';

export interface Completion {
  /** Buttons earned. */
  buttons: number;
  firstClear: boolean;
  /** Decor that just became buyable thanks to the new stars. */
  unlocked: DecorItem[];
}

interface PlayerState {
  /** Best stars per level id (daily puzzles are tracked separately). */
  progress: Record<string, Stars>;
  buttons: number;
  hints: number;
  ownedDecor: string[];
  room: Record<DecorSlot, string>;
  /** 7-day reward strip: which day is next and when it was last claimed. */
  dailyReward: { next: number; lastClaim: string | null };
  /** Daily puzzle history: stars per day and the current streak. */
  dailyPuzzle: { results: Record<string, Stars>; streak: number; lastDay: string | null };
  settings: { sound: boolean; haptics: boolean };

  completeLevel(levelId: string, stars: Stars): Completion;
  completeDaily(day: string, stars: Stars): Completion;
  canClaimDailyReward(today: string): boolean;
  claimDailyReward(today: string): DailyReward | null;
  spendHint(): boolean;
  buyDecor(id: string): boolean;
  equipDecor(id: string): void;
  setSetting(key: keyof PlayerState['settings'], value: boolean): void;
  resetProgress(): void;
}

const initial = {
  progress: {} as Record<string, Stars>,
  buttons: 0,
  hints: STARTING_HINTS,
  ownedDecor: DECOR.filter((d) => d.price === 0).map((d) => d.id),
  room: { ...DEFAULT_ROOM },
  dailyReward: { next: 0, lastClaim: null as string | null },
  dailyPuzzle: { results: {} as Record<string, Stars>, streak: 0, lastDay: null as string | null },
  settings: { sound: true, haptics: true },
};

export function totalStars(progress: Record<string, number>): number {
  return Object.values(progress).reduce((n, s) => n + s, 0);
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...initial,

      completeLevel(levelId, stars) {
        const { progress, buttons } = get();
        const prev = progress[levelId];
        const earned = levelReward(prev, stars);
        const next = { ...progress, [levelId]: Math.max(prev ?? 0, stars) as Stars };
        set({ progress: next, buttons: buttons + earned });
        return {
          buttons: earned,
          firstClear: prev === undefined,
          unlocked: newlyUnlocked(totalStars(progress), totalStars(next)),
        };
      },

      completeDaily(day, stars) {
        const { dailyPuzzle, buttons } = get();
        const prev = dailyPuzzle.results[day];
        if (prev !== undefined) {
          // Replaying today's puzzle: keep the best result, small token reward.
          set({
            dailyPuzzle: {
              ...dailyPuzzle,
              results: { ...dailyPuzzle.results, [day]: Math.max(prev, stars) as Stars },
            },
            buttons: buttons + 2,
          });
          return { buttons: 2, firstClear: false, unlocked: [] };
        }
        const continues = dailyPuzzle.lastDay !== null && daysBetween(dailyPuzzle.lastDay, day) === 1;
        const streak = continues ? dailyPuzzle.streak + 1 : 1;
        const earned = dailyPuzzleReward(stars, streak);
        set({
          dailyPuzzle: { results: { ...dailyPuzzle.results, [day]: stars }, streak, lastDay: day },
          buttons: buttons + earned,
        });
        return { buttons: earned, firstClear: true, unlocked: [] };
      },

      canClaimDailyReward(today) {
        return get().dailyReward.lastClaim !== today;
      },

      claimDailyReward(today) {
        const { dailyReward, buttons, hints } = get();
        if (dailyReward.lastClaim === today) return null;
        const reward = DAILY_REWARDS[dailyReward.next];
        set({
          buttons: buttons + reward.buttons,
          hints: hints + reward.hints,
          dailyReward: { next: (dailyReward.next + 1) % DAILY_REWARDS.length, lastClaim: today },
        });
        return reward;
      },

      spendHint() {
        const { hints } = get();
        if (hints <= 0) return false;
        set({ hints: hints - 1 });
        return true;
      },

      buyDecor(id) {
        const item = decorById(id);
        const { buttons, ownedDecor, progress, room } = get();
        if (!item || ownedDecor.includes(id)) return false;
        if (totalStars(progress) < item.stars || buttons < item.price) return false;
        set({
          buttons: buttons - item.price,
          ownedDecor: [...ownedDecor, id],
          room: { ...room, [item.slot]: id },
        });
        return true;
      },

      equipDecor(id) {
        const item = decorById(id);
        const { ownedDecor, room } = get();
        if (!item || !ownedDecor.includes(id)) return;
        set({ room: { ...room, [item.slot]: id } });
      },

      setSetting(key, value) {
        set({ settings: { ...get().settings, [key]: value } });
      },

      resetProgress() {
        set({ ...initial, settings: get().settings });
      },
    }),
    {
      name: 'cozy-backpack/player',
      version: 1,
      storage: createJSONStorage(() => kvStorage),
    },
  ),
);

/** A level is open when it's the first one or the one before it was finished. */
export function isUnlocked(levelId: string, progress: Record<string, number>): boolean {
  const levels = allLevels();
  const i = levels.findIndex((l) => l.id === levelId);
  return i === 0 || (i > 0 && progress[levels[i - 1].id] !== undefined);
}

/** The level the backpack on the desk opens: first unfinished, else the last one. */
export function nextToPlay(progress: Record<string, number>): string {
  const levels = allLevels();
  return (levels.find((l) => progress[l.id] === undefined) ?? levels[levels.length - 1]).id;
}
