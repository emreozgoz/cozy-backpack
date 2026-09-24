import { Canvas, type Transforms3d } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { CatSkia } from '@/art/CatSkia';
import { feedback } from '@/features/feedback';

import { springs } from './springs';
import { Text } from '@/ui/Text';

// "Pamuk", the desk cat (Style A). She curls up on one desk item — which can't
// be picked up while she's there — until the player pets her. Pure charm: no
// score, no timer.

function CatDrawing({ size, happy, tail }: { size: number; happy: boolean; tail: SharedValue<number> }) {
  const s = size / 100;
  const tailTransform = useDerivedValue<Transforms3d>(() => [
    { translateX: 78 * s },
    { translateY: 70 * s },
    { rotate: tail.get() },
    { translateX: -78 * s },
    { translateY: -70 * s },
  ]);
  return (
    <Canvas style={{ width: size, height: size }}>
      <CatSkia size={size} happy={happy} tailTransform={tailTransform} />
    </Canvas>
  );
}

interface Props {
  /** Center of the item she sits on, in board pixels. */
  x: number;
  y: number;
  size: number;
  petLabel: string;
  onGone(): void;
}

export function DeskCat({ x, y, size, petLabel, onGone }: Props) {
  const reduceMotion = useReducedMotion();
  const [petted, setPetted] = useState(false);
  const drop = useSharedValue(-260);
  const leave = useSharedValue(0);
  const breathe = useSharedValue(0);
  const tail = useSharedValue(0);
  const hearts = useSharedValue(0);

  useEffect(() => {
    drop.set(withSpring(0, springs.bouncy));
    if (reduceMotion) return;
    tail.set(
      withRepeat(withSequence(withTiming(0.35, { duration: 700 }), withTiming(-0.15, { duration: 700 })), -1),
    );
    breathe.set(
      withRepeat(withSequence(withTiming(1, { duration: 1300 }), withTiming(0, { duration: 1300 })), -1),
    );
  }, [drop, tail, breathe, reduceMotion]);

  const pet = () => {
    if (petted) return;
    setPetted(true);
    feedback.star(2);
    hearts.set(withTiming(1, { duration: 900 }));
    leave.set(withDelay(900, withTiming(1, { duration: 420 })));
    setTimeout(onGone, 1350);
  };

  const catStyle = useAnimatedStyle(() => ({
    opacity: 1 - leave.get(),
    transform: [
      { translateX: x - size / 2 + leave.get() * 220 },
      { translateY: y - size * 0.62 + drop.get() - Math.sin(leave.get() * Math.PI) * 60 },
      { scaleY: 1 + breathe.get() * 0.03 },
    ],
  }));
  const heartStyle = useAnimatedStyle(() => ({
    opacity: hearts.get() > 0 ? 1 - hearts.get() : 0,
    transform: [{ translateY: -hearts.get() * 50 }, { scale: 0.8 + hearts.get() * 0.5 }],
  }));

  return (
    <Animated.View style={[styles.cat, { width: size, height: size }, catStyle]}>
      <Pressable
        onPress={pet}
        accessibilityRole="button"
        accessibilityLabel={petLabel}
        hitSlop={10}
        style={StyleSheet.absoluteFill}
      >
        <CatDrawing size={size} happy={petted} tail={tail} />
      </Pressable>
      <Animated.View pointerEvents="none" style={[styles.hearts, heartStyle]}>
        <Text style={styles.heart}>♥ ♥</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cat: { position: 'absolute', left: 0, top: 0, zIndex: 150 },
  hearts: { position: 'absolute', top: -6, left: 0, right: 0, alignItems: 'center' },
  heart: { color: '#F79E89', fontSize: 20, fontWeight: '800' },
});
