import { formatMs } from '@/game/time';

describe('formatMs', () => {
  it('shows minutes, seconds and tenths', () => {
    expect(formatMs(0)).toBe('0:00.0');
    expect(formatMs(42_345)).toBe('0:42.3');
    expect(formatMs(65_300)).toBe('1:05.3');
  });
});
