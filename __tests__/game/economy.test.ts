import { dayKey, daysBetween, levelReward } from '@/game/economy';

describe('economy', () => {
  it('pays most for a first clear', () => {
    expect(levelReward(undefined, 3)).toBe(25);
    expect(levelReward(undefined, 1)).toBe(15);
  });

  it('pays replays only for newly earned stars, plus a little', () => {
    expect(levelReward(1, 3)).toBe(12);
    expect(levelReward(3, 3)).toBe(2);
    expect(levelReward(3, 1)).toBe(2);
  });

  it('keys days in local time and counts days between them', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    expect(daysBetween('2026-09-23', '2026-09-23')).toBe(0);
  });
});
