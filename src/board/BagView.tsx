import {
  Canvas,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { BagPattern } from '@/art/bagSkins';
import { KeychainCharm } from '@/art/keychains';
import type { KeychainId } from '@/data/keychains';
import type { BagSkin } from '@/data/themes';
import type { LevelDef } from '@/game/types';
import type { Palette } from '@/ui/tokens';

import type { BoardLayout } from './layout';

interface Props {
  skin: BagSkin;
  keychain?: KeychainId | null;
  layout: BoardLayout;
  level: LevelDef;
  palette: Palette;
}

/** Static bag body: fabric, zipper band, and a faint dashed grid per compartment. */
export function BagView({ layout, level, palette, skin, keychain }: Props) {
  // The chosen bag pattern colours the fabric; the grid stays calm and light.
  const bodyColor = palette.isDark ? skin.body.dark : skin.body.light;
  const insideColor = palette.isDark ? skin.inside.dark : skin.inside.light;
  const { bag, cell, compartments } = layout;

  const grid = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (const f of compartments) {
      for (let x = 1; x < f.cols; x++) {
        p.moveTo(f.x + x * cell, f.y + 4);
        p.lineTo(f.x + x * cell, f.y + f.rows * cell - 4);
      }
      for (let y = 1; y < f.rows; y++) {
        p.moveTo(f.x + 4, f.y + y * cell);
        p.lineTo(f.x + f.cols * cell - 4, f.y + y * cell);
      }
    }
    return p.detach();
  }, [compartments, cell]);

  const blocked = level.bag.compartments.flatMap((c) => {
    const f = compartments.find((k) => k.id === c.id);
    return f ? (c.blocked ?? []).map(([x, y]) => ({ x: f.x + x * cell, y: f.y + y * cell })) : [];
  });

  const handleW = Math.min(bag.w * 0.34, cell * 2.4);
  const handleH = cell * 0.62;
  const handlePath = `M ${bag.x + bag.w / 2 - handleW / 2} ${bag.y + 8} q 0 ${-handleH} ${handleW / 2} ${-handleH} q ${handleW / 2} 0 ${handleW / 2} ${handleH}`;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* carry handle */}
      <Path
        path={handlePath}
        style="stroke"
        strokeWidth={cell * 0.2}
        strokeCap="round"
        color={shade(bodyColor)}
      />
      {/* body */}
      <Group transform={[{ translateY: 6 }]} opacity={0.16}>
        <RoundedRect x={bag.x} y={bag.y} width={bag.w} height={bag.h} r={cell * 0.6} color="#5B4636" />
      </Group>
      <RoundedRect x={bag.x} y={bag.y} width={bag.w} height={bag.h} r={cell * 0.6}>
        <LinearGradient
          start={vec(0, bag.y)}
          end={vec(0, bag.y + bag.h)}
          colors={[bodyColor, shade(bodyColor)]}
        />
      </RoundedRect>
      <BagPattern
        skin={skin}
        x={bag.x}
        y={bag.y}
        w={bag.w}
        h={bag.h}
        r={cell * 0.6}
        step={cell * 0.9}
        isDark={palette.isDark}
      />
      {/* compartments (the zipper itself is drawn by <Zipper>) */}
      {compartments.map((f) => {
        const isPocket = level.bag.compartments.find((c) => c.id === f.id)?.kind !== 'main';
        const pad = cell * 0.22;
        return (
          <Group key={f.id}>
            {isPocket ? (
              // a sewn-on patch of fabric, so pockets read as separate from the main bag
              <Group>
                <RoundedRect
                  x={f.x - pad}
                  y={f.y - pad}
                  width={f.cols * cell + pad * 2}
                  height={f.rows * cell + pad * 2}
                  r={cell * 0.3}
                  color={shade(bodyColor)}
                />
                <RoundedRect
                  x={f.x - pad + 4}
                  y={f.y - pad + 4}
                  width={f.cols * cell + pad * 2 - 8}
                  height={f.rows * cell + pad * 2 - 8}
                  r={cell * 0.26}
                  style="stroke"
                  strokeWidth={1.5}
                  color="rgba(255,255,255,0.6)"
                >
                  <DashPathEffect intervals={[4, 4]} />
                </RoundedRect>
              </Group>
            ) : null}
            <RoundedRect
              x={f.x - 3}
              y={f.y - 3}
              width={f.cols * cell + 6}
              height={f.rows * cell + 6}
              r={cell * 0.25}
              color={insideColor}
            />
          </Group>
        );
      })}
      <Path path={grid} style="stroke" strokeWidth={1.5} color={palette.gridLine} strokeCap="round">
        <DashPathEffect intervals={[5, 6]} />
      </Path>
      {blocked.map((b, i) => (
        <RoundedRect
          key={i}
          x={b.x + 3}
          y={b.y + 3}
          width={cell - 6}
          height={cell - 6}
          r={8}
          color={bodyColor}
        />
      ))}
      {keychain ? (
        <KeychainCharm
          id={keychain}
          cx={bag.x + bag.w + cell * 0.1}
          cy={bag.y + cell * 1.3}
          size={cell * 0.62}
        />
      ) : null}
    </Canvas>
  );
}

function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * 0.9);
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}
