import { catalog } from '@/data/catalog';
import { levelSchema } from '@/data/schema';
import { dailyId, generateDaily } from '@/game/daily';
import { createInstances } from '@/game/placement';
import { solve } from '@/game/solver';

const days = Array.from({ length: 45 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8, 1 + i));
  return d.toISOString().slice(0, 10);
});

describe('daily puzzle', () => {
  it('is the same puzzle for the same day', () => {
    expect(generateDaily('2026-09-23', catalog)).toEqual(generateDaily('2026-09-23', catalog));
  });

  it('differs from day to day', () => {
    const a = JSON.stringify(generateDaily('2026-09-23', catalog));
    const b = JSON.stringify(generateDaily('2026-09-24', catalog));
    expect(a).not.toEqual(b);
  });

  it.each(days)('%s is solvable and well-formed', (day) => {
    const level = generateDaily(day, catalog);
    expect(level.id).toBe(dailyId(day));
    // same shape as hand-made levels, apart from id/week/day
    expect(levelSchema.safeParse({ ...level, id: 'w01-d1', week: 1, day: 'mon' }).success).toBe(true);
    const found = solve(level, createInstances(level, catalog));
    expect(found.solutions.length).toBe(1);
    expect(level.items.some((i) => i.role === 'distractor')).toBe(true);
  });

  it('knows the real weekday', () => {
    expect(generateDaily('2026-09-23', catalog).day).toBe('wed');
    expect(generateDaily('2026-09-26', catalog).day).toBe('sat');
  });
});
