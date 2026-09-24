import { Circle, Group, Oval, Path, RoundedRect, Skia } from '@shopify/react-native-skia';

import type { BagSkin } from '@/data/themes';

// Bag patterns (Style A): a sparse, soft scatter of motifs clipped to the bag
// body. Pure Skia so previews can render it headless.

interface Props {
  skin: BagSkin;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  /** Motif spacing in px. */
  step: number;
  isDark: boolean;
}

function star(cx: number, cy: number, R: number) {
  const q = R * 0.3;
  return `M ${cx} ${cy - R} Q ${cx + q} ${cy - q} ${cx + R} ${cy} Q ${cx + q} ${cy + q} ${cx} ${cy + R} Q ${cx - q} ${cy + q} ${cx - R} ${cy} Q ${cx - q} ${cy - q} ${cx} ${cy - R} Z`;
}

export function BagPattern({ skin, x, y, w, h, r, step, isDark }: Props) {
  if (skin.pattern === 'none') return null;
  const clip = Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r);
  const motifs = [];
  let row = 0;
  for (let py = y + step * 0.5; py < y + h; py += step * 0.85, row++) {
    for (let px = x + (row % 2 ? step * 0.5 : 0) + step * 0.3; px < x + w; px += step) {
      const k = motifs.length;
      const color = skin.patternColors[k % skin.patternColors.length];
      const s = step * 0.16;
      switch (skin.pattern) {
        case 'dots':
          motifs.push(<Circle key={k} cx={px} cy={py} r={s * 0.8} color={color} />);
          break;
        case 'stars':
          motifs.push(<Path key={k} path={star(px, py, k % 3 ? s : s * 1.5)} color={color} />);
          break;
        case 'leaves':
          motifs.push(
            <Group
              key={k}
              transform={[{ translateX: px }, { translateY: py }, { rotate: k % 2 ? 0.6 : -0.5 }]}
            >
              <Oval x={-s * 1.2} y={-s * 0.55} width={s * 2.4} height={s * 1.1} color={color} />
            </Group>,
          );
          break;
        case 'sprinkles':
          motifs.push(
            <Group key={k} transform={[{ translateX: px }, { translateY: py }, { rotate: (k * 1.3) % 3.1 }]}>
              <RoundedRect x={-s} y={-s * 0.3} width={s * 2} height={s * 0.6} r={s * 0.3} color={color} />
            </Group>,
          );
          break;
        case 'flowers':
          motifs.push(
            <Group key={k}>
              {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI * 2;
                return (
                  <Circle
                    key={i}
                    cx={px + Math.cos(a) * s * 0.7}
                    cy={py + Math.sin(a) * s * 0.7}
                    r={s * 0.55}
                    color={color}
                  />
                );
              })}
              <Circle cx={px} cy={py} r={s * 0.45} color="#FFE29A" />
            </Group>,
          );
          break;
      }
    }
  }
  return (
    <Group clip={clip} opacity={isDark ? 0.45 : 0.6}>
      {motifs}
    </Group>
  );
}
