import { dailyId } from '@/game/daily';
import { solve } from '@/game/solver';
import { useGameStore, visibleInstances } from '@/store/useGameStore';
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

describe('surprise items', () => {
  it('drop onto the desk after enough items are packed', () => {
    game().load('w03-d3'); // permission slip appears after 3 packed items
    const { level, instances } = game();
    const solution = solve(level!, instances).solutions[0];
    const slip = instances.find((i) => i.def.id === 'permission_slip')!;
    expect(visibleInstances(instances, game().revealed)).not.toContain(slip);

    const others = Object.keys(solution).filter((uid) => uid !== slip.uid);
    for (const uid of others.slice(0, 2)) {
      const p = solution[uid];
      while (game().orient[uid].rotation !== p.rotation) game().rotate(uid);
      game().place(uid, p.compartmentId, p.x, p.y);
    }
    expect(game().revealed).toEqual([]);
    const third = others[2];
    const p3 = solution[third];
    while (game().orient[third].rotation !== p3.rotation) game().rotate(third);
    game().place(third, p3.compartmentId, p3.x, p3.y);
    expect(game().revealed).toEqual([slip.uid]);
    expect(game().announcement).toBe('permission_slip');
  });

  it('arrive when zipping too early, without costing a star', () => {
    game().load('w04-d5'); // birthday gift appears after 4
    expect(game().zip()).toEqual([{ kind: 'surprise', uid: expect.stringContaining('gift') }]);
    expect(game().failedZips).toBe(0);
    packLevel();
    expect(game().zip()).toEqual([]);
    expect(game().stars).toBe(3);
  });
});
