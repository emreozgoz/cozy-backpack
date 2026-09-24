import { DAILY_REWARDS, STARTING_HINTS } from '@/game/economy';
import { isUnlocked, nextToPlay, totalStars, usePlayerStore } from '@/store/usePlayerStore';

jest.mock('@/store/storage', () => {
  const mem = new Map<string, string>();
  return {
    kvStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    },
  };
});

const store = () => usePlayerStore.getState();

beforeEach(() => store().resetProgress());

describe('player progress', () => {
  it('starts fresh', () => {
    expect(store().buttons).toBe(0);
    expect(store().hints).toBe(STARTING_HINTS);
    expect(nextToPlay(store().progress)).toBe('w01-d1');
  });

  it('records the best stars and pays for clears', () => {
    expect(store().completeLevel('w01-d1', 2)).toMatchObject({ buttons: 20, firstClear: true });
    expect(store().completeLevel('w01-d1', 1)).toMatchObject({ buttons: 2, firstClear: false });
    expect(store().progress['w01-d1']).toBe(2);
    expect(store().buttons).toBe(22);
    expect(nextToPlay(store().progress)).toBe('w01-d2');
  });

  it('unlocks levels in order', () => {
    expect(isUnlocked('w01-d1', {})).toBe(true);
    expect(isUnlocked('w01-d2', {})).toBe(false);
    expect(isUnlocked('w01-d2', { 'w01-d1': 1 })).toBe(true);
  });

  it('reports decor that new stars made buyable', () => {
    const first = store().completeLevel('w01-d1', 3); // 0 → 3 stars
    expect(first.unlocked.map((d) => d.id)).toEqual(['plant_cactus']);
    const { unlocked } = store().completeLevel('w01-d2', 3); // 3 → 6 stars
    expect(unlocked.map((d) => d.id)).toEqual(['curtain_lavender']);
    expect(totalStars(store().progress)).toBe(6);
  });
});

describe('decor', () => {
  it('needs enough stars and buttons, then equips the purchase', () => {
    expect(store().buyDecor('plant_cactus')).toBe(false); // no stars yet
    store().completeLevel('w01-d1', 3); // 3 stars, 25 buttons
    expect(store().buyDecor('plant_cactus')).toBe(true);
    expect(store().buttons).toBe(5);
    expect(store().room.plant).toBe('plant_cactus');
    expect(store().buyDecor('plant_cactus')).toBe(false); // already owned
    store().equipDecor('plant_none');
    expect(store().room.plant).toBe('plant_none');
  });
});

describe('daily reward', () => {
  it('can be claimed once a day and walks the 7-day strip', () => {
    expect(store().claimDailyReward('2026-09-23')).toEqual(DAILY_REWARDS[0]);
    expect(store().claimDailyReward('2026-09-23')).toBeNull();
    // skipping days does not reset the strip
    expect(store().claimDailyReward('2026-09-30')).toEqual(DAILY_REWARDS[1]);
    expect(store().hints).toBe(STARTING_HINTS + DAILY_REWARDS[1].hints);
  });
});

describe('daily puzzle', () => {
  it('counts a streak over consecutive days', () => {
    store().completeDaily('2026-09-22', 3);
    store().completeDaily('2026-09-23', 2);
    expect(store().dailyPuzzle.streak).toBe(2);
    store().completeDaily('2026-09-25', 3);
    expect(store().dailyPuzzle.streak).toBe(1);
  });

  it('pays only a token amount for replaying the same day', () => {
    store().completeDaily('2026-09-23', 1);
    expect(store().completeDaily('2026-09-23', 3).buttons).toBe(2);
    expect(store().dailyPuzzle.results['2026-09-23']).toBe(3);
  });
});

describe('hints', () => {
  it('spends until none are left', () => {
    for (let i = 0; i < STARTING_HINTS; i++) expect(store().spendHint()).toBe(true);
    expect(store().spendHint()).toBe(false);
  });
});

describe('keychains', () => {
  it('are reported once, on the finish that earns them', () => {
    expect(store().completeLevel('w01-d1', 3).keychains).toEqual([]);
    expect(store().completeLevel('w01-d2', 3).keychains).toEqual(['star']); // 6 stars ≥ 5
    expect(store().completeLevel('w01-d2', 3).keychains).toEqual([]);
  });

  it('follow Daily Bag streaks', () => {
    store().completeDaily('2026-09-20', 3);
    store().completeDaily('2026-09-21', 3);
    expect(store().completeDaily('2026-09-22', 3).keychains).toEqual(['cloud']);
    // breaking the streak keeps what was earned
    store().completeDaily('2026-09-30', 3);
    expect(store().dailyPuzzle.best).toBe(3);
  });
});
