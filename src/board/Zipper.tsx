import { Canvas, Group, rect, RoundedRect } from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { feedback } from '@/features/feedback';
import { useT } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import type { Palette } from '@/ui/tokens';

import type { BoardLayout } from './layout';
import { springs } from './springs';

const TOOTH = 7; // spacing between teeth, px
const COMMIT = 0.55; // how far the tab must travel before we try to close
const TICKS = 14; // haptic ticks along the track

interface Props {
  layout: BoardLayout;
  palette: Palette;
}

/**
 * The bag's zipper. Pull the tab right to close: past COMMIT the bag is
 * checked — a correct bag zips all the way, otherwise the tab sticks halfway
 * and slides back. Tapping the tab tries once, for players who don't drag.
 */
export function Zipper({ layout, palette }: Props) {
  const { x0, x1, y } = layout.zip;
  const len = x1 - x0;
  const size = Math.max(10, layout.cell * 0.2);
  const { ui } = useT();
  const status = useGameStore((s) => s.status);
  // Every required item is in the bag: nudge the tab now and then. This says
  // "you can try", not "it is correct" — rules are still checked on closing.
  const ready = useGameStore(
    (s) => s.status === 'playing' && s.instances.every((i) => i.role !== 'required' || !!s.placements[i.uid]),
  );
  const nudge = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!ready || reduceMotion) {
      nudge.set(withTiming(0, { duration: 150 }));
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(withDelay(1800, withTiming(1, { duration: 180 })), withSpring(0, springs.bouncy)),
        -1,
      ),
    );
  }, [ready, reduceMotion, nudge]);

  const p = useSharedValue(0);
  const startP = useSharedValue(0);
  const lastTick = useSharedValue(0);

  // Replaying a won level opens the bag again.
  const wasWon = useRef(false);
  useEffect(() => {
    if (status === 'won') wasWon.current = true;
    else if (wasWon.current) {
      wasWon.current = false;
      p.set(withSpring(0, springs.settle));
    }
  }, [status, p]);

  const attempt = () => {
    const issues = useGameStore.getState().zip();
    if (issues.length === 0) {
      p.set(withTiming(1, { duration: 320 }));
      feedback.zipClosed();
    } else {
      p.set(withSequence(withTiming(0.5, { duration: 160 }), withSpring(0, springs.bouncy)));
      feedback.zipStuck();
    }
  };
  const tick = () => feedback.zipTick();

  const pan = Gesture.Pan()
    .enabled(status !== 'won')
    .hitSlop({ top: 16, bottom: 16, left: 16, right: 16 })
    .onStart(() => {
      startP.set(p.get());
    })
    .onUpdate((e) => {
      const next = Math.max(0, Math.min(1, startP.get() + e.translationX / len));
      p.set(next);
      const t = Math.floor(next * TICKS);
      if (t !== lastTick.get()) {
        lastTick.set(t);
        scheduleOnRN(tick);
      }
    })
    .onEnd(() => {
      if (p.get() >= COMMIT) scheduleOnRN(attempt);
      else p.set(withSpring(0, springs.settle));
    });

  const tap = Gesture.Tap()
    .enabled(status !== 'won')
    .hitSlop({ top: 16, bottom: 16, left: 16, right: 16 })
    .onEnd(() => {
      scheduleOnRN(attempt);
    });

  const closedClip = useDerivedValue(() => rect(x0 - 6, y - size, len * p.get() + 6, size * 2));
  const openClip = useDerivedValue(() =>
    rect(x0 + len * p.get(), y - size, len * (1 - p.get()) + 6, size * 2),
  );

  const tabStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x0 + len * p.get() - size + nudge.get() * size * 0.9 },
      { translateY: y - size },
      { rotate: `${nudge.get() * -8}deg` },
    ],
  }));

  const count = Math.floor(len / TOOTH);
  const band = palette.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(91,70,54,0.18)';
  const toothOpen = 'rgba(255,255,255,0.6)';
  const toothClosed = palette.isDark ? '#D8C8B8' : '#FFF6EC';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <RoundedRect
          x={x0 - 8}
          y={y - size * 0.7}
          width={len + 16}
          height={size * 1.4}
          r={size * 0.7}
          color={band}
        />
        {/* open: two rows of teeth, slightly apart */}
        <Group clip={openClip}>
          {Array.from({ length: count }, (_, i) => (
            <RoundedRect
              key={i}
              x={x0 + i * TOOTH}
              y={y - (i % 2 ? size * 0.55 : 0.1)}
              width={TOOTH * 0.62}
              height={size * 0.42}
              r={1.5}
              color={toothOpen}
            />
          ))}
        </Group>
        {/* closed: one interlocked row */}
        <Group clip={closedClip}>
          <RoundedRect
            x={x0 - 6}
            y={y - size * 0.3}
            width={len + 6}
            height={size * 0.6}
            r={size * 0.3}
            color={band}
          />
          {Array.from({ length: count }, (_, i) => (
            <RoundedRect
              key={i}
              x={x0 + i * TOOTH}
              y={y - size * 0.28}
              width={TOOTH * 0.7}
              height={size * 0.56}
              r={1.5}
              color={toothClosed}
            />
          ))}
        </Group>
      </Canvas>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={ui.zipper}
          accessibilityHint={ui.zipperHint}
          style={[styles.tab, { width: size * 2, height: size * 3.4 }, tabStyle]}
        >
          <View
            style={[
              styles.ring,
              {
                width: size * 2,
                height: size * 2,
                borderRadius: size,
                backgroundColor: '#FFE29A',
                borderColor: '#E8C46A',
              },
            ]}
          />
          <View
            style={[
              styles.pull,
              {
                width: size * 0.9,
                height: size * 1.8,
                borderRadius: size * 0.45,
                marginTop: -size * 0.3,
                backgroundColor: '#FFE29A',
              },
            ]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { position: 'absolute', left: 0, top: 0, alignItems: 'center' },
  ring: { borderWidth: 3 },
  pull: {},
});
