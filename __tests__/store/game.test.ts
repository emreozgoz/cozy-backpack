import { dailyId } from '@/game/daily';
import { solve } from '@/game/solver';
import { useGameStore } from '@/store/useGameStore';
import { usePlayerStore } from '@/store/usePlayerStore';

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

const game = () => useGameStore.getState();

/** Packs the loaded level exactly as the solver would. */
function packLevel() {
  const { level, instances } = game();
  const solution = solve(level!, instances).solutions[0];
  for (const [uid, p] of Object.entries(solution)) {
    // match the orientation first (as tapping would), then drop it in
    while (game().orient[uid].rotation !== p.rotation || game().orient[uid].shapeIndex !== p.shapeIndex) {
      game().rotate(uid);
    }
    expect(game().place(uid, p.compartmentId, p.x, p.y)).toBe(true);
  }
}

beforeEach(() => usePlayerStore.getState().resetProgress());

describe('playing a level end to end', () => {
  it('a stuck zip costs a star, a correct bag saves progress', () => {
    game().load('w01-d1');
    expect(
      game()
        .zip()
        .map((i) => i.kind),
    ).toContain('missing');
    packLevel();
    expect(game().zip()).toEqual([]);
    expect(game().status).toBe('won');
    expect(game().stars).toBe(2);
    expect(game().completion).toMatchObject({ buttons: 20, firstClear: true });
    expect(usePlayerStore.getState().progress['w01-d1']).toBe(2);
    expect(usePlayerStore.getState().buttons).toBe(20);
  });

  it('a level that needs rotation can be packed with taps', () => {
    game().load('w01-d3');
    packLevel();
    expect(game().zip()).toEqual([]);
    expect(game().stars).toBe(3);
  });

  it('the daily puzzle counts toward the daily streak', () => {
    game().load(dailyId('2026-09-23'));
    packLevel();
    expect(game().zip()).toEqual([]);
    expect(usePlayerStore.getState().dailyPuzzle).toMatchObject({ streak: 1, lastDay: '2026-09-23' });
  });
});
