import { generateDaily, isDailyId, DAILY_PREFIX } from '@/game/daily';
import type { LevelDef } from '@/game/types';

import { catalog } from './catalog';

import { levelIndex } from './levelIndex';

export function allLevels(): LevelDef[] {
  return levelIndex;
}

export function getLevel(id: string): LevelDef | undefined {
  if (isDailyId(id)) return generateDaily(id.slice(DAILY_PREFIX.length), catalog);
  return levelIndex.find((l) => l.id === id);
}

export function nextLevelId(id: string): string | undefined {
  const i = levelIndex.findIndex((l) => l.id === id);
  return i >= 0 ? levelIndex[i + 1]?.id : undefined;
}

export function levelsByWeek(): { week: number; levels: LevelDef[] }[] {
  const weeks = new Map<number, LevelDef[]>();
  for (const l of levelIndex) weeks.set(l.week, [...(weeks.get(l.week) ?? []), l]);
  return [...weeks].map(([week, levels]) => ({ week, levels }));
}
