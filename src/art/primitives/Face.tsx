import { Circle, Group, Oval, Path, type Transforms3d } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

export type Expression = 'idle' | 'held' | 'happy' | 'worried';

interface Props {
  cx: number;
  cy: number;
  /** Roughly the width of the surface the face sits on. */
  size: number;
  expression: Expression;
  /** Animated eye transform (blinking), built by the caller around `cy`. */
  eyeTransform?: SharedValue<Transforms3d> | Transforms3d;
  ink: string;
  blush: string;
}

/** Style A face: dot eyes, blush, tiny mouth. Everything scales from `size`. */
export function Face({ cx, cy, size, expression, eyeTransform, ink, blush }: Props) {
  const held = expression === 'held';
  const er = size * (held ? 0.095 : 0.075);
  const gap = size * 0.18;
  const m = size * 0.07;
  const stroke = Math.max(1.4, size * 0.028);

  const eyes =
    expression === 'happy' ? (
      // ^ ^
      <Path
        path={`M ${cx - gap - er} ${cy + er * 0.4} q ${er} ${-er * 1.8} ${er * 2} 0 M ${cx + gap - er} ${cy + er * 0.4} q ${er} ${-er * 1.8} ${er * 2} 0`}
        style="stroke"
        strokeWidth={stroke}
        strokeCap="round"
        color={ink}
      />
    ) : (
      <Group transform={held ? undefined : eyeTransform}>
        <Circle cx={cx - gap} cy={cy} r={er} color={ink} />
        <Circle cx={cx + gap} cy={cy} r={er} color={ink} />
        {held ? (
          <>
            <Circle cx={cx - gap + er * 0.35} cy={cy - er * 0.35} r={er * 0.32} color="#FFFFFF" />
            <Circle cx={cx + gap + er * 0.35} cy={cy - er * 0.35} r={er * 0.32} color="#FFFFFF" />
          </>
        ) : null}
      </Group>
    );

  const mouthY = cy + size * 0.1;
  let mouth;
  switch (expression) {
    case 'held':
      mouth = <Oval x={cx - m * 0.6} y={mouthY - m * 0.3} width={m * 1.2} height={m * 1.3} color={ink} />;
      break;
    case 'worried':
      mouth = (
        <Path
          path={`M ${cx - m} ${mouthY + m * 0.4} q ${m * 0.5} ${-m * 0.5} ${m} 0 q ${m * 0.5} ${m * 0.5} ${m} 0`}
          style="stroke"
          strokeWidth={stroke}
          strokeCap="round"
          color={ink}
        />
      );
      break;
    default: {
      const wide = expression === 'happy' ? 1.35 : 1;
      mouth = (
        <Path
          path={`M ${cx - m * wide} ${mouthY} q ${m * wide} ${m * 1.1 * wide} ${m * 2 * wide} 0`}
          style="stroke"
          strokeWidth={stroke}
          strokeCap="round"
          color={ink}
        />
      );
    }
  }

  return (
    <Group>
      {eyes}
      <Oval x={cx - gap * 1.75 - size * 0.08} y={cy + er * 1.4} width={size * 0.16} height={size * 0.1} color={blush} opacity={0.7} />
      <Oval x={cx + gap * 1.75 - size * 0.08} y={cy + er * 1.4} width={size * 0.16} height={size * 0.1} color={blush} opacity={0.7} />
      {mouth}
    </Group>
  );
}
