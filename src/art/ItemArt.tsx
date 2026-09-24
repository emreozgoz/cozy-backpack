import { Canvas, type Transforms3d } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { ItemDef, Subject } from '@/game/types';
import { itemColor } from '@/ui/colors';

import { shade } from './color';
import { itemDrawing, itemSize, ItemSkia } from './ItemSkia';
import type { Expression } from './primitives/Face';
import { Text } from '@/ui/Text';

const LABELS: Record<Subject, string> = {
  math: 'π',
  turkish: 'Aa',
  science: '✿',
  life: '☼',
  social: '⌂',
  history: '⧗',
  english: 'Hi',
  art: '✎',
  music: '♪',
  pe: '●',
};

interface Props {
  def: ItemDef;
  shapeIndex: number;
  cell: number;
  isDark: boolean;
  expression?: Expression;
}

/** An item on screen: the Skia drawing plus blinking and the subject label. */
export function ItemArt({ def, shapeIndex, cell, isDark, expression = 'idle' }: Props) {
  const { w, h } = itemSize(def, shapeIndex, cell);
  const drawing = itemDrawing(def, shapeIndex, cell, isDark);
  const faceY = drawing.face?.cy ?? 0;

  // Each item blinks on its own lazy rhythm.
  const blink = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const wait = 2600 + Math.random() * 3800;
    blink.set(
      withRepeat(
        withSequence(withDelay(wait, withTiming(0.1, { duration: 70 })), withTiming(1, { duration: 110 })),
        -1,
      ),
    );
  }, [blink, reduceMotion]);
  const eyeTransform = useDerivedValue<Transforms3d>(() => [
    { translateY: faceY },
    { scaleY: blink.get() },
    { translateY: -faceY },
  ]);

  const label = def.subject && drawing.label ? LABELS[def.subject] : null;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <ItemSkia
          def={def}
          shapeIndex={shapeIndex}
          cell={cell}
          isDark={isDark}
          expression={expression}
          eyeTransform={eyeTransform}
        />
      </Canvas>
      {label && drawing.label ? (
        <View
          pointerEvents="none"
          style={[
            styles.label,
            {
              left: drawing.label.cx - w / 2,
              top: drawing.label.cy - drawing.label.size,
              width: w,
              height: drawing.label.size * 2,
            },
          ]}
        >
          <Text
            style={{
              fontSize: drawing.label.size,
              fontWeight: '800',
              color: shade(itemColor(def.color, isDark), -0.55),
              opacity: 0.75,
            }}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
