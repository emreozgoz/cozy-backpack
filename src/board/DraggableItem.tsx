import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ItemArt } from '@/art/ItemArt';
import type { Expression } from '@/art/primitives/Face';
import { bounds, parseShape, shapeVariants } from '@/game/shapes';
import type { ItemInstance, Orientation } from '@/game/types';
import { feedback } from '@/features/feedback';

import type { Target } from './layout';
import { springs } from './springs';

export type Highlight = 'none' | 'issue' | 'hint';

interface Props {
  inst: ItemInstance;
  orientation: Orientation;
  cell: number;
  target: Target;
  placed: boolean;
  highlight: Highlight;
  isDark: boolean;
  warnColor: string;
  hintColor: string;
  /** Called while dragging whenever the item crosses half a cell. */
  onDragMove(uid: string, left: number, top: number): void;
  /** Returns where the item should settle after the drop. */
  onDrop(uid: string, left: number, top: number): Target;
  /** Returns false when the item can't turn where it is. */
  onTap(uid: string): boolean;
  /** A surprise: drop in from above the screen instead of appearing in place. */
  enter?: boolean;
  /** Something (the cat) is sitting on it: it can't be picked up. */
  locked?: boolean;
}

const LIFT = -18; // raise the item above the finger while dragging

export function DraggableItem(props: Props) {
  const { inst, orientation, cell, target, placed, highlight, isDark } = props;
  const size = bounds(parseShape(shapeVariants(inst.def)[orientation.shapeIndex] ?? inst.def.shape));
  const quarter = orientation.rotation % 180 !== 0;
  const w = (quarter ? size.h : size.w) * cell;
  const h = (quarter ? size.w : size.h) * cell;
  const baseW = size.w * cell;
  const baseH = size.h * cell;

  const cx = useSharedValue(target.x);
  const cy = useSharedValue(props.enter ? target.y - 480 : target.y);
  const scale = useSharedValue(props.enter ? target.scale * 0.7 : target.scale);
  const raise = useSharedValue(0);
  const lift = useSharedValue(0);
  const tilt = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const squash = useSharedValue(0);
  const angle = useSharedValue<number>(orientation.rotation);
  const start = useSharedValue({ x: 0, y: 0 });
  const lastKey = useSharedValue('');
  const dragging = useSharedValue(0);
  const breathe = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  // Items breathe very slightly, each on its own phase, so the desk feels alive.
  useEffect(() => {
    if (reduceMotion) return;
    const half = 1400 + Math.random() * 600;
    breathe.set(
      withDelay(
        Math.random() * 1500,
        withRepeat(withSequence(withTiming(1, { duration: half }), withTiming(0, { duration: half })), -1),
      ),
    );
  }, [breathe, reduceMotion]);
  const [held, setHeld] = useState(false);
  const [happy, setHappy] = useState(false);

  useEffect(() => {
    if (!happy) return;
    const t = setTimeout(() => setHappy(false), 900);
    return () => clearTimeout(t);
  }, [happy]);

  const expression: Expression = held ? 'held' : highlight === 'issue' ? 'worried' : happy ? 'happy' : 'idle';

  // Surprises thump onto the desk.
  useEffect(() => {
    if (!props.enter) return;
    const t = setTimeout(() => feedback.place(), 380);
    return () => clearTimeout(t);
  }, [props.enter]);

  // Settle on the target whenever it changes (placement, desk reflow, rotation).
  useEffect(() => {
    cx.set(withSpring(target.x, springs.settle));
    cy.set(withSpring(target.y, springs.settle));
    scale.set(withSpring(target.scale, springs.settle));
  }, [target.x, target.y, target.scale, cx, cy, scale]);

  // Spin the art toward the new rotation, always clockwise.
  const prevRotation = useRef(orientation.rotation);
  useEffect(() => {
    const delta = (orientation.rotation - prevRotation.current + 360) % 360;
    prevRotation.current = orientation.rotation;
    if (delta) {
      angle.set(withSpring(angle.get() + delta, springs.rotate));
      feedback.rotate();
    }
  }, [orientation.rotation, angle]);

  // Soft items "flop" when they fold into another shape.
  const prevShape = useRef(orientation.shapeIndex);
  useEffect(() => {
    if (prevShape.current !== orientation.shapeIndex) {
      prevShape.current = orientation.shapeIndex;
      squash.set(withSequence(withTiming(1, { duration: 90 }), withSpring(0, springs.bouncy)));
      feedback.fold();
    }
  }, [orientation.shapeIndex, squash]);

  // A "remove me" hint or a stuck-zip issue gets one gentle wiggle.
  useEffect(() => {
    if (highlight !== 'none') {
      wiggle.set(
        withSequence(
          withTiming(1, { duration: 90 }),
          withTiming(-1, { duration: 120 }),
          withSpring(0, springs.bouncy),
        ),
      );
    }
  }, [highlight, wiggle]);

  const drop = (left: number, top: number) => {
    setHeld(false);
    const t = props.onDrop(inst.uid, left, top);
    cx.set(withSpring(t.x, springs.settle));
    cy.set(withSpring(t.y, springs.settle));
    // land with a little squash
    scale.set(
      withSequence(withTiming(t.scale * 1.06, { duration: 70 }), withSpring(t.scale, springs.bouncy)),
    );
    squash.set(withSequence(withTiming(0.6, { duration: 70 }), withSpring(0, springs.bouncy)));
    if (t.scale === 1) {
      setHappy(true);
      feedback.place();
    }
  };

  const tap = () => {
    if (!props.onTap(inst.uid)) {
      feedback.nope();
      wiggle.set(
        withSequence(
          withTiming(1, { duration: 70 }),
          withTiming(-1, { duration: 100 }),
          withSpring(0, springs.bouncy),
        ),
      );
    }
  };

  const pickUp = () => {
    setHeld(true);
    feedback.pickup();
  };

  const release = () => setHeld(false);

  const pan = Gesture.Pan()
    .enabled(!props.locked)
    .minDistance(4)
    .onBegin(() => {
      lift.set(withSpring(1, springs.pickup));
    })
    .onStart(() => {
      dragging.set(1);
      start.set({ x: cx.get(), y: cy.get() });
      scale.set(withSpring(1.06, springs.pickup));
      raise.set(withSpring(LIFT, springs.pickup));
      scheduleOnRN(pickUp);
    })
    .onUpdate((e) => {
      cx.set(start.get().x + e.translationX);
      cy.set(start.get().y + e.translationY);
      tilt.set(withSpring(Math.max(-5, Math.min(5, e.velocityX * 0.004)), springs.tilt));
      const left = cx.get() - w / 2;
      const top = cy.get() + raise.get() - h / 2;
      const key = `${Math.round(left / (cell / 2))},${Math.round(top / (cell / 2))}`;
      if (key !== lastKey.get()) {
        lastKey.set(key);
        scheduleOnRN(props.onDragMove, inst.uid, left, top);
      }
    })
    .onEnd(() => {
      const left = cx.get() - w / 2;
      const top = cy.get() + raise.get() - h / 2;
      scheduleOnRN(drop, left, top);
    })
    .onFinalize(() => {
      dragging.set(0);
      scheduleOnRN(release);
      lastKey.set('');
      lift.set(withSpring(0, springs.settle));
      raise.set(withSpring(0, springs.settle));
      tilt.set(withSpring(0, springs.tilt));
      if (scale.get() > 1.01 || scale.get() < target.scale - 0.01) {
        scale.set(withSpring(target.scale, springs.settle));
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(!props.locked)
    .maxDistance(6)
    .onBegin(() => {
      lift.set(withSpring(0.5, springs.pickup));
    })
    .onEnd(() => {
      scheduleOnRN(tap);
    })
    .onFinalize(() => {
      lift.set(withSpring(0, springs.settle));
    });

  const gesture = Gesture.Race(pan, tapGesture);

  const outerStyle = useAnimatedStyle(() => ({
    zIndex: dragging.get() ? 100 : placed ? 1 : 2,
    transform: [
      { translateX: cx.get() - w / 2 },
      { translateY: cy.get() + raise.get() - h / 2 },
      { rotate: `${tilt.get() + wiggle.get() * 4}deg` },
      { scaleX: scale.get() * (1 + squash.get() * 0.06 + lift.get() * 0.02 + breathe.get() * 0.008) },
      { scaleY: scale.get() * (1 - squash.get() * 0.06 + lift.get() * 0.02 + breathe.get() * 0.014) },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: lift.get() * 0.22,
    transform: [{ translateY: 4 + lift.get() * 10 - raise.get() * 0.4 }, { scale: 1 - lift.get() * 0.04 }],
  }));

  const artStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.get()}deg` }],
  }));

  const ring = highlight === 'issue' ? props.warnColor : highlight === 'hint' ? props.hintColor : null;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.item, { width: w, height: h }, outerStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.shadow, { borderRadius: Math.min(cell * 0.28, 16) }, shadowStyle]}
        />
        <Animated.View
          style={[
            styles.art,
            { width: baseW, height: baseH, left: (w - baseW) / 2, top: (h - baseH) / 2 },
            artStyle,
          ]}
        >
          <ItemArt
            def={inst.def}
            shapeIndex={orientation.shapeIndex}
            cell={cell}
            isDark={isDark}
            expression={expression}
          />
        </Animated.View>
        {ring ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, { borderColor: ring, borderRadius: Math.min(cell * 0.3, 18) }]}
          />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', left: 0, top: 0 },
  art: { position: 'absolute' },
  shadow: {
    ...StyleSheet.absoluteFill,
    margin: 6,
    backgroundColor: '#5B4636',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    margin: -2,
    borderWidth: 3,
  },
});
