import { create } from 'zustand';

import { catalog } from '@/data/catalog';
import { getLevel } from '@/data/levels';
import { DAILY_PREFIX, isDailyId } from '@/game/daily';
import { findHint, type Hint } from '@/game/hint';
import { canPlace, createInstances, type Placements } from '@/game/placement';
import { validateBag, type Issue } from '@/game/rules';
import { starsFor, type Stars } from '@/game/scoring';
import { bounds, nextOrientation, orientedCells } from '@/game/shapes';
import type { ItemInstance, LevelDef, Orientation, Placement } from '@/game/types';

import { usePlayerStore, type Completion } from './usePlayerStore';
import { useShopStore } from './useShopStore';

type Status = 'playing' | 'won';

interface GameState {
  level: LevelDef | null;
  instances: ItemInstance[];
  placements: Placements;
  /** Orientation of every instance, on the desk or in the bag. */
  orient: Record<string, Orientation>;
  failedZips: number;
  hintsUsed: number;
  status: Status;
  stars: Stars | null;
  /** What finishing the level earned (saved to the player the moment it zips). */
  completion: Completion | null;
  /** Problems from the last stuck zip, shown as gentle glows until the next move. */
  issues: Issue[];
  hint: Hint | null;

  load(levelId: string): void;
  place(uid: string, compartmentId: string, x: number, y: number): boolean;
  unplace(uid: string): void;
  rotate(uid: string): boolean;
  zip(): Issue[];
  requestHint(): Hint | null;
}

const UPRIGHT: Orientation = { rotation: 0, shapeIndex: 0 };

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  instances: [],
  placements: {},
  orient: {},
  failedZips: 0,
  hintsUsed: 0,
  status: 'playing',
  stars: null,
  completion: null,
  issues: [],
  hint: null,

  load(levelId) {
    const level = getLevel(levelId);
    if (!level) throw new Error(`Unknown level ${levelId}`);
    const instances = createInstances(level, catalog);
    set({
      level,
      instances,
      placements: {},
      orient: Object.fromEntries(instances.map((i) => [i.uid, UPRIGHT])),
      failedZips: 0,
      hintsUsed: 0,
      status: 'playing',
      stars: null,
      completion: null,
      issues: [],
      hint: null,
    });
  },

  place(uid, compartmentId, x, y) {
    const { level, instances, placements, orient, hint } = get();
    const inst = instances.find((i) => i.uid === uid);
    if (!level || !inst) return false;
    const p: Placement = { compartmentId, x, y, ...orient[uid] };
    if (!canPlace(level, instances, placements, inst, p)) return false;
    set({
      placements: { ...placements, [uid]: p },
      issues: [],
      hint: hint?.uid === uid ? null : hint,
    });
    return true;
  },

  unplace(uid) {
    const { placements, hint } = get();
    if (!placements[uid]) return;
    const { [uid]: _removed, ...rest } = placements;
    set({ placements: rest, issues: [], hint: hint?.kind === 'remove' && hint.uid === uid ? null : hint });
  },

  rotate(uid) {
    const { level, instances, placements, orient } = get();
    const inst = instances.find((i) => i.uid === uid);
    if (!level || !inst) return false;
    const next = nextOrientation(inst.def, orient[uid]);
    const current = placements[uid];
    if (!current) {
      set({ orient: { ...orient, [uid]: next } });
      return true;
    }
    // In the bag: keep the item roughly where it is, nudging if needed.
    const before = bounds(orientedCells(inst.def, current));
    const after = bounds(orientedCells(inst.def, next));
    const cx = Math.round(current.x + (before.w - after.w) / 2);
    const cy = Math.round(current.y + (before.h - after.h) / 2);
    const anchors = [
      [current.x, current.y],
      [cx, cy],
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1],
    ];
    for (const [x, y] of anchors) {
      const p: Placement = { compartmentId: current.compartmentId, x, y, ...next };
      if (canPlace(level, instances, placements, inst, p)) {
        set({ placements: { ...placements, [uid]: p }, orient: { ...orient, [uid]: next }, issues: [] });
        return true;
      }
    }
    return false;
  },

  zip() {
    const { level, instances, placements, failedZips, hintsUsed } = get();
    if (!level) return [];
    const issues = validateBag(level, instances, placements);
    if (issues.length === 0) {
      const stars = starsFor(failedZips, hintsUsed);
      const player = usePlayerStore.getState();
      const completion = isDailyId(level.id)
        ? player.completeDaily(level.id.slice(DAILY_PREFIX.length), stars)
        : player.completeLevel(level.id, stars);
      useShopStore.getState().noteLevelCleared(isDailyId(level.id));
      set({ status: 'won', stars, completion, issues: [], hint: null });
    } else {
      set({ failedZips: failedZips + 1, issues });
    }
    return issues;
  },

  requestHint() {
    const { level, instances, placements, hintsUsed } = get();
    if (!level) return null;
    const hint = findHint(level, instances, placements);
    if (hint) set({ hint, hintsUsed: hintsUsed + 1, issues: [] });
    return hint;
  },
}));
