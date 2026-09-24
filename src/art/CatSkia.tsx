import { Circle, Group, Oval, Path, type Transforms3d } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

import { Face } from './primitives/Face';

// "Pamuk", the desk cat — Style A. Drawn in a 100×100 box scaled to `size`.

const FUR = '#F9B97C';
const FUR_DARK = '#E9A262';

export function CatSkia({
  size,
  happy,
  tailTransform,
}: {
  size: number;
  happy: boolean;
  tailTransform?: SharedValue<Transforms3d> | Transforms3d;
}) {
  const s = size / 100;
  return (
    <Group>
      {/* tail */}
      <Group transform={tailTransform}>
        <Path
          path={`M ${78 * s} ${70 * s} Q ${100 * s} ${62 * s} ${94 * s} ${40 * s}`}
          style="stroke"
          strokeWidth={9 * s}
          strokeCap="round"
          color={FUR_DARK}
        />
      </Group>
      {/* loaf body */}
      <Oval x={12 * s} y={46 * s} width={72 * s} height={44 * s} color={FUR} />
      {/* ears + head */}
      <Path path={`M ${22 * s} ${32 * s} L ${28 * s} ${10 * s} L ${40 * s} ${24 * s} Z`} color={FUR_DARK} />
      <Path path={`M ${58 * s} ${24 * s} L ${70 * s} ${10 * s} L ${76 * s} ${32 * s} Z`} color={FUR_DARK} />
      <Circle cx={49 * s} cy={42 * s} r={27 * s} color={FUR} />
      {/* stripes */}
      <Path
        path={`M ${40 * s} ${18 * s} q ${9 * s} ${-3 * s} ${18 * s} 0 M ${43 * s} ${24 * s} q ${6 * s} ${-2 * s} ${12 * s} 0`}
        style="stroke"
        strokeWidth={2.5 * s}
        strokeCap="round"
        color={FUR_DARK}
      />
      <Face
        cx={49 * s}
        cy={44 * s}
        size={46 * s}
        expression={happy ? 'happy' : 'idle'}
        ink="#5B4636"
        blush="#F7A6A0"
      />
      {/* paws */}
      <Oval x={30 * s} y={80 * s} width={14 * s} height={9 * s} color="#FFF1E3" />
      <Oval x={52 * s} y={80 * s} width={14 * s} height={9 * s} color="#FFF1E3" />
    </Group>
  );
}
