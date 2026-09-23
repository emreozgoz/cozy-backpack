import type { WithSpringConfig } from 'react-native-reanimated';

// Spring presets from the style guide (§4). Soft and a little bouncy —
// nothing snaps harshly.
export const springs = {
  pickup: { damping: 14, stiffness: 260, mass: 0.8 },
  settle: { damping: 16, stiffness: 180, mass: 1 },
  bouncy: { damping: 9, stiffness: 220, mass: 0.7 },
  rotate: { damping: 12, stiffness: 200, mass: 0.8 },
  tilt: { damping: 20, stiffness: 160 },
} satisfies Record<string, WithSpringConfig>;
