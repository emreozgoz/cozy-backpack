import {
  BlendColor,
  CornerPathEffect,
  Group,
  Paint,
  Path,
  PathOp,
  Skia,
  type SkPath,
  type Transforms3d,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { parseShape, shapeVariants } from '@/game/shapes';
import type { Cell, ItemDef } from '@/game/types';
import { itemColor } from '@/ui/colors';

import { blush, ink } from './color';
import { drawItem, type Drawing } from './items';
import { Face, type Expression } from './primitives/Face';

// Pure Skia drawing of one item — no React Native or Reanimated runtime
// imports, so scripts/render-art-preview.tsx can render it headless.

const GAP = 3;

/** Union of the shape's cells, inset on the outside so neighbours don't touch. */
function bodyPath(cells: Cell[], c: number): SkPath {
  const has = new Set(cells.map((k) => `${k.x},${k.y}`));
  let path: SkPath | null = null;
  for (const { x, y } of cells) {
    const l = has.has(`${x - 1},${y}`) ? 0 : GAP;
    const r = has.has(`${x + 1},${y}`) ? 0 : GAP;
    const t = has.has(`${x},${y - 1}`) ? 0 : GAP;
    const b = has.has(`${x},${y + 1}`) ? 0 : GAP;
    const cellPath = Skia.Path.Rect(Skia.XYWHRect(x * c + l, y * c + t, c - l - r, c - t - b));
    // Union (not just adding rects) so CornerPathEffect rounds only the outline.
    path = path ? (Skia.Path.MakeFromOp(path, cellPath, PathOp.Union) ?? path) : cellPath;
  }
  return path ?? Skia.Path.Make();
}

export function itemSize(def: ItemDef, shapeIndex: number, cell: number) {
  const cells = parseShape(shapeVariants(def)[shapeIndex] ?? def.shape);
  return {
    cells,
    w: Math.max(...cells.map((k) => k.x + 1)) * cell,
    h: Math.max(...cells.map((k) => k.y + 1)) * cell,
  };
}

export function itemDrawing(def: ItemDef, shapeIndex: number, cell: number, isDark: boolean): Drawing {
  const { w, h, cells } = itemSize(def, shapeIndex, cell);
  return drawItem(def.sprite, { w, h, c: cell, base: itemColor(def.color, isDark), isDark, cells });
}

interface Props {
  def: ItemDef;
  shapeIndex: number;
  cell: number;
  isDark: boolean;
  expression: Expression;
  eyeTransform?: SharedValue<Transforms3d> | Transforms3d;
}

/** Style A ("pastel & yüzlü") item at its true bag size, unrotated. */
export function ItemSkia({ def, shapeIndex, cell, isDark, expression, eyeTransform }: Props) {
  const { cells } = useMemo(() => itemSize(def, shapeIndex, cell), [def, shapeIndex, cell]);
  const path = useMemo(() => bodyPath(cells, cell), [cells, cell]);
  const base = itemColor(def.color, isDark);
  const radius = Math.min(cell * 0.3, 16);
  const drawing = itemDrawing(def, shapeIndex, cell, isDark);
  const body = drawing.body ?? (
    <Path path={path} color={base}>
      <CornerPathEffect r={radius} />
    </Path>
  );

  return (
    <Group>
      {/* soft, low shadow: the body silhouette tinted cocoa */}
      <Group
        transform={[{ translateY: 3 }]}
        layer={
          <Paint opacity={isDark ? 0.3 : 0.14}>
            <BlendColor color="#5B4636" mode="srcIn" />
          </Paint>
        }
      >
        {body}
      </Group>
      {body}
      {drawing.details}
      {drawing.face ? (
        <Face
          {...drawing.face}
          expression={expression}
          eyeTransform={eyeTransform}
          ink={isDark ? ink.dark : ink.light}
          blush={isDark ? blush.dark : blush.light}
        />
      ) : null}
    </Group>
  );
}
