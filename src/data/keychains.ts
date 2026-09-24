// Keychains: little charms earned by playing (never bought). One can hang
// from the bag. Art: src/art/keychains.tsx; names in src/i18n.

export type KeychainId =
  | 'star'
  | 'heart'
  | 'apple'
  | 'cat'
  | 'cloud'
  | 'rainbow'
  | 'sun'
  | 'pencil'
  | 'trophy'
  | 'tie'
  | 'mortarboard'
  | 'plane';

export interface PlayerStats {
  totalStars: number;
  /** Best stars per level id. */
  progress: Record<string, number>;
  /** Longest Daily Bag streak ever. */
  bestStreak: number;
  /** Daily Bags ever finished. */
  dailySolved: number;
}

export type KeychainGoal =
  | { kind: 'stars'; count: number }
  | { kind: 'level'; levelId: string }
  | { kind: 'streak'; days: number }
  | { kind: 'daily'; count: number };

export interface Keychain {
  id: KeychainId;
  goal: KeychainGoal;
}

export const KEYCHAINS: Keychain[] = [
  { id: 'star', goal: { kind: 'stars', count: 5 } },
  { id: 'heart', goal: { kind: 'level', levelId: 'w01-d5' } },
  { id: 'cloud', goal: { kind: 'streak', days: 3 } },
  { id: 'apple', goal: { kind: 'stars', count: 30 } },
  { id: 'cat', goal: { kind: 'level', levelId: 'w04-d4' } },
  { id: 'rainbow', goal: { kind: 'streak', days: 7 } },
  { id: 'sun', goal: { kind: 'daily', count: 15 } },
  { id: 'pencil', goal: { kind: 'level', levelId: 'w06-d5' } },
  { id: 'trophy', goal: { kind: 'stars', count: 90 } },
  // one for finishing each bag season
  { id: 'tie', goal: { kind: 'level', levelId: 'w10-d5' } },
  { id: 'mortarboard', goal: { kind: 'level', levelId: 'w14-d5' } },
  { id: 'plane', goal: { kind: 'level', levelId: 'w18-d5' } },
];

export function goalMet(goal: KeychainGoal, s: PlayerStats): boolean {
  switch (goal.kind) {
    case 'stars':
      return s.totalStars >= goal.count;
    case 'level':
      return s.progress[goal.levelId] !== undefined;
    case 'streak':
      return s.bestStreak >= goal.days;
    case 'daily':
      return s.dailySolved >= goal.count;
  }
}

export function earnedKeychains(s: PlayerStats): KeychainId[] {
  return KEYCHAINS.filter((k) => goalMet(k.goal, s)).map((k) => k.id);
}

/** Keychains earned by going from `before` to `after`. */
export function newKeychains(before: PlayerStats, after: PlayerStats): KeychainId[] {
  const had = new Set(earnedKeychains(before));
  return earnedKeychains(after).filter((id) => !had.has(id));
}
