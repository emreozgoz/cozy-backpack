import { Canvas, Circle, Group, Path, RoundedRect } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// A soft burst of hearts, stars and confetti from the bag's opening when it
// zips shut. One shared clock drives every particle (simple ballistic motion),
// so the whole effect costs a single animation.

const COLORS = ['#F79E89', '#FFE29A', '#A8D8F0', '#BDE7C9', '#CDB4F0', '#F7B6C8'];
const DURATION = 1.9; // seconds
const GRAVITY = 1500; // px/s²

type Kind = 'heart' | 'star' | 'dot' | 'strip';

interface Particle {
  kind: Kind;
  color: string;
  vx: number;
  vy: number;
  spin: number;
  size: number;
  delay: number;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function makeParticles(count: number, spread: number): Particle[] {
  const r = rng(7);
  const kinds: Kind[] = ['heart', 'star', 'dot', 'strip', 'strip', 'dot'];
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (r() - 0.5) * 1.9;
    const speed = 520 + r() * 520;
    return {
      kind: kinds[i % kinds.length],
      color: COLORS[Math.floor(r() * COLORS.length)],
      vx: Math.cos(angle) * speed * (spread / 300),
      vy: Math.sin(angle) * speed,
      spin: (r() - 0.5) * 720,
      size: 7 + r() * 7,
      delay: r() * 0.12,
    };
  });
}

const heart = (s: number) =>
  `M 0 ${s * 0.9} C ${-s * 1.6} ${-s * 0.1} ${-s * 0.6} ${-s * 1.2} 0 ${-s * 0.3} C ${s * 0.6} ${-s * 1.2} ${s * 1.6} ${-s * 0.1} 0 ${s * 0.9} Z`;
const star = (s: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? s * 0.45 : s;
    return `${i ? 'L' : 'M'} ${Math.cos(a) * rr} ${Math.sin(a) * rr}`;
  }).join(' ') + ' Z';

function Piece({ p, t, ox, oy }: { p: Particle; t: SharedValue<number>; ox: number; oy: number }) {
  const transform = useDerivedValue(() => {
    const T = Math.max(0, t.get() * DURATION - p.delay);
    return [
      { translateX: ox + p.vx * T },
      { translateY: oy + p.vy * T + 0.5 * GRAVITY * T * T },
      { rotate: (p.spin * T * Math.PI) / 180 },
    ];
  });
  const opacity = useDerivedValue(() => {
    const k = t.get();
    return k < 0.02 ? 0 : k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
  });
  const s = p.size;
  return (
    <Group transform={transform} opacity={opacity}>
      {p.kind === 'heart' ? <Path path={heart(s * 0.8)} color={p.color} /> : null}
      {p.kind === 'star' ? <Path path={star(s)} color={p.color} /> : null}
      {p.kind === 'dot' ? <Circle cx={0} cy={0} r={s * 0.45} color={p.color} /> : null}
      {p.kind === 'strip' ? (
        <RoundedRect x={-s * 0.25} y={-s * 0.7} width={s * 0.5} height={s * 1.4} r={2} color={p.color} />
      ) : null}
    </Group>
  );
}

interface Props {
  /** Burst origin (the middle of the bag's opening). */
  x: number;
  y: number;
  /** Rough horizontal reach, e.g. the bag width. */
  spread: number;
}

export function Celebration({ x, y, spread }: Props) {
  const t = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const particles = useMemo(() => makeParticles(reduceMotion ? 0 : 38, spread), [spread, reduceMotion]);

  useEffect(() => {
    t.set(withTiming(1, { duration: DURATION * 1000, easing: Easing.linear }));
  }, [t]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Piece key={i} p={p} t={t} ox={x} oy={y} />
      ))}
    </Canvas>
  );
}
