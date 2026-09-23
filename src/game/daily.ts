import { createInstances } from './placement';
import { orientedCells } from './shapes';
import { solve } from './solver';
import type { Catalog, LevelDef, LevelItemRef, Subject, Weekday } from './types';

// "Günün Çantası": one puzzle per calendar day, the same for every player.
// Everything is derived from the date with a seeded RNG and then proven
// solvable with the solver, so no server is needed.

export const DAILY_PREFIX = 'daily-';

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Subjects the daily can schedule, with the items each one needs. */
const SUBJECT_ITEMS: Partial<Record<Subject, string[]>> = {
  math: ['book_math'],
  turkish: ['book_turkish'],
  science: ['book_science'],
  life: ['book_life'],
  social: ['book_social'],
  history: ['book_history'],
  english: ['book_english'],
  art: ['sketchbook', 'crayons'],
  music: ['flute'],
};
const TOYS = ['toy_car', 'ball', 'comic', 'plush', 'cards'];
const GRIDS: [number, number][] = [
  [5, 5],
  [5, 6],
  [6, 6],
  [6, 7],
  [7, 7],
];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483646 || 1;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(r: () => number, list: T[]): T {
  return list[Math.floor(r() * list.length)];
}

function shuffle<T>(r: () => number, list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isDailyId(id: string): boolean {
  return id.startsWith(DAILY_PREFIX);
}

export function dailyId(dayKey: string): string {
  return `${DAILY_PREFIX}${dayKey}`;
}

/** Builds the daily puzzle for a "YYYY-MM-DD" day key. Deterministic. */
export function generateDaily(dayKey: string, catalog: Catalog): LevelDef {
  const r = rng(hash(dayKey));
  const [y, m, d] = dayKey.split('-').map(Number);
  const day = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  const subjects = shuffle(r, Object.keys(SUBJECT_ITEMS) as Subject[]);
  const count = r() < 0.65 ? 2 : 3;
  const schedule = subjects.slice(0, count);

  const required: string[] = schedule.flatMap((s) => SUBJECT_ITEMS[s]!);
  required.push('pencil_case');
  const optional = ['lunchbox', 'water_bottle', 'notebook'].filter(() => r() < 0.55);

  const offSchedule = subjects.slice(count).flatMap((s) => SUBJECT_ITEMS[s]!.slice(0, 1));
  const distractors = [pick(r, TOYS), ...(r() < 0.6 ? [pick(r, offSchedule)] : [])];

  const cellsOf = (ref: string) => orientedCells(catalog[ref], { rotation: 0, shapeIndex: 0 }).length;

  // Try the smallest comfortable grid first; drop optional extras if needed.
  for (let extras = optional.length; extras >= 0; extras--) {
    const needed = [...required, ...optional.slice(0, extras)];
    const cells = needed.reduce((n, ref) => n + cellsOf(ref), 0);
    for (const [cols, rows] of GRIDS) {
      const slack = 1 - cells / (cols * rows);
      if (slack < 0.06 || slack > 0.3) continue;
      const items: LevelItemRef[] = [
        ...needed.map((ref) => ({ ref, role: 'required' as const })),
        ...distractors.map((ref) => ({ ref, role: 'distractor' as const })),
      ];
      const level: LevelDef = {
        id: dailyId(dayKey),
        week: 0,
        day,
        schedule,
        bag: { type: 'backpack', compartments: [{ id: 'main', kind: 'main', cols, rows }] },
        items: shuffle(r, items),
      };
      const found = solve(level, createInstances(level, catalog), { nodeBudget: 200_000 });
      if (found.solutions.length) return level;
    }
  }
  // Practically unreachable; a roomy fallback that always packs.
  return {
    id: dailyId(dayKey),
    week: 0,
    day,
    schedule: ['math'],
    bag: { type: 'backpack', compartments: [{ id: 'main', kind: 'main', cols: 5, rows: 5 }] },
    items: [
      { ref: 'book_math', role: 'required' },
      { ref: 'pencil_case', role: 'required' },
      { ref: 'toy_car', role: 'distractor' },
    ],
  };
}
