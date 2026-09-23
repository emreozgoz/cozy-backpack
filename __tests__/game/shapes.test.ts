import { bounds, orientedCells, parseShape, rotateCells } from '@/game/shapes';
import type { ItemDef } from '@/game/types';

const sorted = (cells: { x: number; y: number }[]) =>
  cells.map((c) => `${c.x},${c.y}`).sort();

describe('shapes', () => {
  it('parses X cells and ignores dots', () => {
    expect(sorted(parseShape(['X.', 'XX']))).toEqual(['0,0', '0,1', '1,1']);
  });

  it('rotates a 1x3 bar into a 3x1 bar', () => {
    const bar = parseShape(['X', 'X', 'X']);
    expect(bounds(rotateCells(bar, 90))).toEqual({ w: 3, h: 1 });
    expect(bounds(rotateCells(bar, 180))).toEqual({ w: 1, h: 3 });
  });

  it('rotates an L clockwise like the screen does', () => {
    // X.      XX
    // XX  ->  X.
    const l = parseShape(['X.', 'XX']);
    expect(sorted(rotateCells(l, 90))).toEqual(['0,0', '0,1', '1,0']);
    expect(sorted(rotateCells(l, 360 as never))).toEqual(sorted(l));
  });

  it('uses the alternative shape for soft items', () => {
    const clothes: ItemDef = {
      id: 'pe_clothes',
      shape: ['XX', 'XX'],
      altShapes: [['X', 'X', 'X', 'X']],
      sprite: 'clothes',
      color: 'pe',
    };
    expect(bounds(orientedCells(clothes, { rotation: 0, shapeIndex: 1 }))).toEqual({ w: 1, h: 4 });
    expect(bounds(orientedCells(clothes, { rotation: 90, shapeIndex: 1 }))).toEqual({ w: 4, h: 1 });
  });
});
