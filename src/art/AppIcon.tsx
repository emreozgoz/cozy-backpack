import { Circle, Group, Path, RadialGradient, Rect, RoundedRect, vec } from '@shopify/react-native-skia';

import { Face } from './primitives/Face';

// The app icon, splash mark and Android adaptive layers — all the same Style A
// backpack. Pure Skia so scripts/render-icons.tsx can render it headless.

export type IconVariant =
  /** Full iOS icon: pastel background + bag. */
  | 'light'
  /** iOS dark appearance: bag on transparent, the system draws the dark ground. */
  | 'dark'
  /** iOS tinted appearance: grayscale bag on transparent. */
  | 'tinted'
  /** Bag only on transparent (splash, Android foreground). */
  | 'mark'
  /** Single-colour silhouette (Android themed icon). */
  | 'mono';

interface Props {
  size: number;
  variant: IconVariant;
  /** Fraction of the canvas the bag is scaled into. */
  scale?: number;
}

const PEACH = '#F4B8A4';
const PEACH_DARK = '#E3A18C';
const POCKET = '#E9A792';
const INK = '#5B4636';

function grey(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const l = Math.round(0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255));
  const v = Math.min(255, l + 30);
  return `rgb(${v},${v},${v})`;
}

export function AppIcon({ size, variant, scale = 0.62 }: Props) {
  const tint = variant === 'tinted' ? grey : (c: string) => c;
  const mono = variant === 'mono';
  const c = (hex: string) => (mono ? '#FFFFFF' : tint(hex));

  // bag geometry in a 100×100 box, scaled into the canvas
  const s = (size * scale) / 100;
  const ox = (size - 100 * s) / 2;
  const oy = (size - 100 * s) / 2 + 4 * s;

  return (
    <Group>
      {variant === 'light' ? (
        <>
          <Rect x={0} y={0} width={size} height={size} color="#CFEAF7" />
          <Circle cx={size * 0.5} cy={size * 0.46} r={size * 0.62}>
            <RadialGradient
              c={vec(size * 0.5, size * 0.46)}
              r={size * 0.62}
              colors={['#EFF9FE', '#CFEAF7', '#B2DCF0']}
            />
          </Circle>
          <Sparkle x={size * 0.2} y={size * 0.22} r={size * 0.035} color="#FFE29A" />
          <Sparkle x={size * 0.82} y={size * 0.3} r={size * 0.028} color="#FFFFFF" />
          <Sparkle x={size * 0.8} y={size * 0.8} r={size * 0.022} color="#FFE29A" />
          <Circle cx={size * 0.16} cy={size * 0.72} r={size * 0.012} color="#FFFFFF" />
        </>
      ) : null}

      <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: s }]}>
        {/* soft ground shadow */}
        {!mono && variant !== 'tinted' ? (
          <RoundedRect x={10} y={88} width={80} height={10} r={5} color={INK} opacity={0.12} />
        ) : null}
        {/* carry handle */}
        <Path
          path="M 36 14 Q 36 -2 50 -2 Q 64 -2 64 14"
          style="stroke"
          strokeWidth={7}
          strokeCap="round"
          color={c(PEACH_DARK)}
        />
        {/* body */}
        <RoundedRect x={8} y={10} width={84} height={84} r={24} color={c(PEACH)} />
        {/* zipper band */}
        <RoundedRect x={16} y={19} width={68} height={7} r={3.5} color={mono ? '#FFFFFF' : tint('#D99583')} />
        {!mono
          ? Array.from({ length: 13 }, (_, i) => (
              <RoundedRect key={i} x={19 + i * 4.8} y={20.5} width={2.6} height={4} r={1} color="#FFF6EC" />
            ))
          : null}
        {/* pull tab */}
        <Circle cx={78} cy={22.5} r={4.2} color={c('#FFE29A')} />
        <RoundedRect x={76.2} y={24} width={3.6} height={9} r={1.8} color={c('#FFE29A')} />
        {/* front pocket */}
        <RoundedRect x={20} y={58} width={60} height={30} r={12} color={c(POCKET)} />
        <RoundedRect
          x={28}
          y={64}
          width={44}
          height={2.6}
          r={1.3}
          color={mono ? PEACH : 'rgba(255,255,255,0.55)'}
        />
        {/* face */}
        {!mono ? (
          <Face cx={50} cy={42} size={52} expression="idle" ink={tint(INK)} blush={tint('#F7A6A0')} />
        ) : null}
      </Group>
    </Group>
  );
}

function Sparkle({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const k = r * 0.28;
  return (
    <Path
      path={`M ${x} ${y - r} Q ${x + k} ${y - k} ${x + r} ${y} Q ${x + k} ${y + k} ${x} ${y + r} Q ${x - k} ${y + k} ${x - r} ${y} Q ${x - k} ${y - k} ${x} ${y - r} Z`}
      color={color}
    />
  );
}
