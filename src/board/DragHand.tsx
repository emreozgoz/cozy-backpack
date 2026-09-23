import { Canvas, Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Point } from './layout';

const W = 44;
const H = 56;

/** Style A pointing hand: a soft mitten with one finger up. */
function Hand() {
  const skin = '#FFE3D3';
  const shade = '#F4C9B3';
  return (
    <Canvas style={{ width: W, height: H }}>
      <Group transform={[{ translateY: 3 }]} opacity={0.18}>
        <RoundedRect x={8} y={20} width={30} height={32} r={14} color="#5B4636" />
      </Group>
      <RoundedRect x={16} y={2} width={12} height={30} r={6} color={skin} />
      <RoundedRect x={8} y={20} width={30} height={32} r={14} color={skin} />
      <RoundedRect x={4} y={28} width={10} height={16} r={5} color={shade} />
      <Circle cx={22} cy={8} r={3} color="#FFFFFF" opacity={0.6} />
    </Canvas>
  );
}

/**
 * The first-level coach: a hand presses on a desk item, carries it to the
 * bag, lifts, and repeats — until the player makes their first move.
 */
export function DragHand({ from, to }: { from: Point; to: Point }) {
  const t = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const move = reduceMotion ? 0 : 1100;
    t.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(500, withTiming(1, { duration: 300 })), // appear + press
          withTiming(2, { duration: move, easing: Easing.inOut(Easing.cubic) }), // carry
          withTiming(3, { duration: 300 }), // release
          withTiming(3, { duration: 700 }), // rest
        ),
        -1,
      ),
    );
  }, [t, reduceMotion]);

  const style = useAnimatedStyle(() => {
    const v = t.get();
    const k = Math.max(0, Math.min(1, v - 1)); // carry progress
    const x = from.x + (to.x - from.x) * k;
    const y = from.y + (to.y - from.y) * k;
    const opacity = v < 1 ? v : v > 2 ? Math.max(0, 3 - v) : 1;
    const press = v < 1 ? 1.1 - v * 0.15 : v > 2 ? 0.95 + (v - 2) * 0.15 : 0.95;
    return {
      opacity,
      transform: [{ translateX: x - W * 0.45 }, { translateY: y - 4 }, { scale: press }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.hand, style]}>
      <Hand />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hand: { position: 'absolute', left: 0, top: 0, zIndex: 250 },
});
