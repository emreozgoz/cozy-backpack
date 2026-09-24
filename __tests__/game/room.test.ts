import { roomLayout, type Box } from '@/art/room/layout';

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Box, w: number, h: number) => a.x >= 0 && a.y >= 0 && a.x + a.w <= w && a.y + a.h <= h;

// Room canvas sizes: phones, iPads, and the decorate screen's shorter preview.
const sizes = [
  [375, 667],
  [440, 956],
  [834, 1194],
  [1032, 1376],
  [440, 520],
] as const;

describe.each(sizes)('room layout %i×%i', (w, h) => {
  const L = roomLayout(w, h);

  it('keeps the tappable backpack and calendar on screen and apart', () => {
    expect(inside(L.backpack, w, h)).toBe(true);
    expect(inside(L.calendar, w, h)).toBe(true);
    expect(overlaps(L.backpack, L.calendar)).toBe(false);
  });

  it('keeps wall pieces from overlapping each other', () => {
    expect(overlaps(L.window, L.wallArt)).toBe(false);
    expect(overlaps(L.wallArt, L.calendar)).toBe(false);
    expect(overlaps(L.backpack, L.window)).toBe(false);
  });

  it('stands the backpack on the desk', () => {
    expect(Math.abs(L.backpack.y + L.backpack.h - L.deskTop)).toBeLessThan(10);
  });
});
