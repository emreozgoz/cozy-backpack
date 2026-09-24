import { Canvas } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { BagSkia, type BagFrame } from '@/art/BagSkia';
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
  const { bag, cell, compartments } = layout;
  const frames = useMemo<BagFrame[]>(
    () =>
      compartments.map((f) => {
        const def = level.bag.compartments.find((c) => c.id === f.id);
        return { ...f, kind: def?.kind ?? 'main', blocked: def?.blocked ?? [] };
      }),
    [compartments, level],
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <BagSkia
        type={level.bag.type}
        skin={skin}
        keychain={keychain}
        bag={bag}
        cell={cell}
        frames={frames}
        isDark={palette.isDark}
        gridLine={palette.gridLine}
      />
    </Canvas>
  );
}
