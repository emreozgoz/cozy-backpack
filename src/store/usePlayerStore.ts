import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DECOR, DEFAULT_ROOM, decorById, newlyUnlocked, type DecorItem, type DecorSlot } from '@/data/decor';
import { newKeychains, type KeychainId, type PlayerStats } from '@/data/keychains';
import { allLevels } from '@/data/levels';
import { BAG_SKINS, THEMES, skinById, themeOfDecor, type BagSkinId, type ThemeId } from '@/data/themes';
import {
  DAILY_REWARDS,
  STARTING_HINTS,
  dailyPuzzleReward,
  daysBetween,
  levelReward,
  type DailyReward,
} from '@/game/economy';
import type { Stars } from '@/game/scoring';

import type { LanguageSetting } from '@/i18n';

import { kvStorage } from './storage';

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  language: LanguageSetting;
  /** Mirrors the zipper so it pulls from right to left. */
  leftHanded: boolean;
}

export interface Completion {
  /** Buttons earned. */
  buttons: number;
  firstClear: boolean;
  /** Decor that just became buyable thanks to the new stars. */
  unlocked: DecorItem[];
  /** Keychains this finish earned. */
  keychains: KeychainId[];
}

interface PlayerState {
  /** Best stars per level id (daily puzzles are tracked separately). */
  progress: Record<string, Stars>;
  buttons: number;
  hints: number;
  ownedDecor: string[];
  room: Record<DecorSlot, string>;
  ownedSkins: BagSkinId[];
  bagSkin: BagSkinId;
  /** Keychain hanging from the bag (see src/data/keychains.ts). */
  keychain: string | null;
  /** Sabah Telaşı (timed mode): best time per level, in ms. */
  rushBest: Record<string, number>;
  /** 7-day reward strip: which day is next and when it was last claimed. */
  dailyReward: { next: number; lastClaim: string | null };
  /** Daily puzzle history: stars per day and the current streak. */
  dailyPuzzle: { results: Record<string, Stars>; streak: number; lastDay: string | null; best?: number };
  settings: Settings;

  completeLevel(levelId: string, stars: Stars): Completion;
  completeDaily(day: string, stars: Stars): Completion;
  canClaimDailyReward(today: string): boolean;
  claimDailyReward(today: string): DailyReward | null;
  spendHint(): boolean;
  addHints(n: number): void;
  addButtons(n: number): void;
  buyDecor(id: string): boolean;
  /** `vip` lets VIP members use VIP-theme decor they don't own outright. */
  equipDecor(id: string, vip?: boolean): void;
  unlockThemes(ids: ThemeId[]): void;
  buySkin(id: BagSkinId): boolean;
  equipSkin(id: BagSkinId, vip?: boolean): void;
  setKeychain(id: string | null): void;
  /** Returns true when this is a new personal best. */
  recordRush(levelId: string, ms: number): boolean;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
  resetProgress(): void;
}

const initial = {
  progress: {} as Record<string, Stars>,
  buttons: 0,
  hints: STARTING_HINTS,
  ownedDecor: DECOR.filter((d) => d.price === 0 && !d.theme).map((d) => d.id),
  room: { ...DEFAULT_ROOM },
  ownedSkins: ['peach'] as BagSkinId[],
  bagSkin: 'peach' as BagSkinId,
  keychain: null as string | null,
  rushBest: {} as Record<string, number>,
  dailyReward: { next: 0, lastClaim: null as string | null },
  dailyPuzzle: { results: {} as Record<string, Stars>, streak: 0, lastDay: null as string | null },
  settings: { sound: true, music: true, haptics: true, language: 'system', leftHanded: false } as Settings,
};

export function statsOf(s: Pick<PlayerState, 'progress' | 'dailyPuzzle'>): PlayerStats {
  return {
    totalStars: totalStars(s.progress),
    progress: s.progress,
    bestStreak: s.dailyPuzzle.best ?? s.dailyPuzzle.streak,
    dailySolved: Object.keys(s.dailyPuzzle.results).length,
  };
}

export function totalStars(progress: Record<string, number>): number {
  return Object.values(progress).reduce((n, s) => n + s, 0);
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...initial,

      completeLevel(levelId, stars) {
        const before = statsOf(get());
        const { progress, buttons } = get();
        const prev = progress[levelId];
        const earned = levelReward(prev, stars);
        const next = { ...progress, [levelId]: Math.max(prev ?? 0, stars) as Stars };
        set({ progress: next, buttons: buttons + earned });
        return {
          buttons: earned,
          firstClear: prev === undefined,
          unlocked: newlyUnlocked(totalStars(progress), totalStars(next)),
          keychains: newKeychains(before, statsOf(get())),
        };
      },

      completeDaily(day, stars) {
        const before = statsOf(get());
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
          return { buttons: 2, firstClear: false, unlocked: [], keychains: [] };
        }
        const continues = dailyPuzzle.lastDay !== null && daysBetween(dailyPuzzle.lastDay, day) === 1;
        const streak = continues ? dailyPuzzle.streak + 1 : 1;
        const earned = dailyPuzzleReward(stars, streak);
        set({
          dailyPuzzle: {
            results: { ...dailyPuzzle.results, [day]: stars },
            streak,
            lastDay: day,
            best: Math.max(dailyPuzzle.best ?? 0, streak),
          },
          buttons: buttons + earned,
        });
        return { buttons: earned, firstClear: true, unlocked: [], keychains: newKeychains(before, statsOf(get())) };
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

      addHints(n) {
        set({ hints: get().hints + n });
      },

      addButtons(n) {
        set({ buttons: get().buttons + n });
      },

      buyDecor(id) {
        const item = decorById(id);
        const { buttons, ownedDecor, progress, room } = get();
        // Theme decor only comes with its theme pack or VIP, never for buttons.
        if (!item || item.theme || ownedDecor.includes(id)) return false;
        if (totalStars(progress) < item.stars || buttons < item.price) return false;
        set({
          buttons: buttons - item.price,
          ownedDecor: [...ownedDecor, id],
          room: { ...room, [item.slot]: id },
        });
        return true;
      },

      equipDecor(id, vip = false) {
        const item = decorById(id);
        const { ownedDecor, room } = get();
        if (!item || !(ownedDecor.includes(id) || (vip && themeOfDecor(id)?.access.kind === 'vip'))) return;
        set({ room: { ...room, [item.slot]: id } });
      },

      unlockThemes(ids) {
        const themes = THEMES.filter((t) => ids.includes(t.id));
        const { ownedDecor, ownedSkins } = get();
        set({
          ownedDecor: [...new Set([...ownedDecor, ...themes.flatMap((t) => t.decor)])],
          ownedSkins: [...new Set([...ownedSkins, ...themes.map((t) => t.bagSkin)])],
        });
      },

      buySkin(id) {
        const skin = skinById(id);
        const { buttons, ownedSkins, progress } = get();
        if (skin.theme || ownedSkins.includes(id) || skin.price === undefined) return false;
        if (totalStars(progress) < (skin.stars ?? 0) || buttons < skin.price) return false;
        set({ buttons: buttons - skin.price, ownedSkins: [...ownedSkins, id], bagSkin: id });
        return true;
      },

      equipSkin(id, vip = false) {
        const skin = skinById(id);
        const vipSkin = !!skin.theme && THEMES.find((t) => t.id === skin.theme)?.access.kind === 'vip';
        if (get().ownedSkins.includes(id) || (vip && vipSkin)) set({ bagSkin: id });
      },

      setKeychain(id) {
        set({ keychain: id });
      },

      recordRush(levelId, ms) {
        const prev = get().rushBest[levelId];
        if (prev !== undefined && prev <= ms) return false;
        set({ rushBest: { ...get().rushBest, [levelId]: ms } });
        return true;
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
      version: 3,
      // v1 saves had no language setting; nested settings are merged key by key
      // so newly added settings get their defaults instead of disappearing.
      migrate: (persisted) => persisted as PlayerState,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PlayerState>;
        return { ...current, ...saved, settings: { ...current.settings, ...saved.settings } };
      },
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

/**
 * What actually shows in the room: VIP-theme decor and bag skins fall back to
 * the defaults when VIP has lapsed (owned theme packs always stay).
 */
export function effectiveRoom(room: Record<DecorSlot, string>, owned: string[], vip: boolean) {
  const out = { ...room };
  for (const slot of Object.keys(out) as DecorSlot[]) {
    const id = out[slot];
    if (!owned.includes(id) && !(vip && themeOfDecor(id)?.access.kind === 'vip'))
      out[slot] = DEFAULT_ROOM[slot];
  }
  return out;
}

export function effectiveSkin(skin: BagSkinId, owned: BagSkinId[], vip: boolean): BagSkinId {
  if (owned.includes(skin)) return skin;
  const theme = skinById(skin).theme;
  return vip && THEMES.find((t) => t.id === theme)?.access.kind === 'vip' ? skin : 'peach';
}

export { BAG_SKINS };
