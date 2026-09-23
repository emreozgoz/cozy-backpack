export type Stars = 1 | 2 | 3;

/**
 * Stars reward accuracy, never speed.
 * 3 = zipped on the first try without hints, 2 = one slip (a stuck zip or a
 * hint), 1 = anything else. A level can always be finished.
 */
export function starsFor(failedZips: number, hintsUsed: number): Stars {
  const slips = failedZips + hintsUsed;
  if (slips === 0) return 3;
  if (slips === 1) return 2;
  return 1;
}
