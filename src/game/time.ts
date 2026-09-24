/** "1:05.3" — minutes, seconds and tenths, for the Sabah Telaşı timer. */
export function formatMs(ms: number): string {
  const tenths = Math.floor(ms / 100);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${tenths % 10}`;
}

/** Sabah Telaşı opens once week 2 is done. */
export const RUSH_UNLOCK_LEVEL = 'w02-d5';
