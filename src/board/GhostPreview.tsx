import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Cell } from '@/game/types';

export type GhostMode = 'fits' | 'blocked' | 'hint';

interface Props {
  cells: Cell[];
  x: number;
  y: number;
  cell: number;
  mode: GhostMode;
  fitsColor: string;
  blockedColor: string;
  hintColor: string;
}

/**
 * Where the held item would land. Fitting cells are filled, blocked ones are
 * only dashed outlines — so the difference isn't carried by color alone.
 * Hints pulse softly.
 */
export function GhostPreview({ cells, x, y, cell, mode, fitsColor, blockedColor, hintColor }: Props) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(
      mode === 'hint'
        ? withRepeat(withSequence(withTiming(0.45, { duration: 700 }), withTiming(1, { duration: 700 })), -1)
        : 1,
    );
  }, [mode, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  const color = mode === 'fits' ? fitsColor : mode === 'blocked' ? blockedColor : hintColor;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {cells.map((c) => (
        <View
          key={`${c.x},${c.y}`}
          style={[
            styles.cell,
            {
              left: x + c.x * cell + 3,
              top: y + c.y * cell + 3,
              width: cell - 6,
              height: cell - 6,
              borderRadius: Math.min(cell * 0.22, 12),
              borderColor: color,
              borderStyle: mode === 'blocked' ? 'dashed' : 'solid',
              backgroundColor: mode === 'blocked' ? 'transparent' : `${color}55`,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: { position: 'absolute', borderWidth: 2 },
});
