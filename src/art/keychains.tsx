import { Circle, Group, Oval, Path, RoundedRect } from '@shopify/react-native-skia';

import type { KeychainId } from '@/data/keychains';

import { Face } from './primitives/Face';

// Keychain charms (Style A): a small ring, a short chain and the charm.
// Drawn around (cx, cy) = the charm's center. Locked ones are soft silhouettes.

interface Props {
  id: KeychainId;
  cx: number;
  cy: number;
  /** Charm width in px. */
  size: number;
  locked?: boolean;
  /** Draw the ring and chain above the charm. */
  withChain?: boolean;
}

const INK = '#5B4636';
const BLUSH = '#F7A6A0';

function starPath(cx: number, cy: number, R: number) {
  return (
    Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? R * 0.5 : R;
      return `${i ? 'L' : 'M'} ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
    }).join(' ') + ' Z'
  );
}

export function KeychainCharm({ id, cx, cy, size, locked = false, withChain = true }: Props) {
  const s = size;
  const c = (color: string) => (locked ? '#D9CEC4' : color);
  const face = (y = cy, scale = 0.55) =>
    locked ? null : <Face cx={cx} cy={y} size={s * scale} expression="happy" ink={INK} blush={BLUSH} />;

  let charm;
  switch (id) {
    case 'star':
      charm = (
        <Group>
          <Path path={starPath(cx, cy, s * 0.5)} color={c('#FFE29A')} />
          {face(cy + s * 0.04, 0.42)}
        </Group>
      );
      break;
    case 'heart':
      charm = (
        <Group>
          <Path
            path={`M ${cx} ${cy + s * 0.42} C ${cx - s * 0.75} ${cy - s * 0.05} ${cx - s * 0.35} ${cy - s * 0.55} ${cx} ${cy - s * 0.2} C ${cx + s * 0.35} ${cy - s * 0.55} ${cx + s * 0.75} ${cy - s * 0.05} ${cx} ${cy + s * 0.42} Z`}
            color={c('#F7B6C8')}
          />
          {face(cy, 0.45)}
        </Group>
      );
      break;
    case 'apple':
      charm = (
        <Group>
          <Path
            path={`M ${cx} ${cy - s * 0.46} q ${s * 0.04} ${-s * 0.12} ${s * 0.18} ${-s * 0.16}`}
            style="stroke"
            strokeWidth={s * 0.06}
            strokeCap="round"
            color={c('#8C6A55')}
          />
          <Oval x={cx + s * 0.02} y={cy - s * 0.62} width={s * 0.26} height={s * 0.14} color={c('#8FC8A2')} />
          <Circle cx={cx - s * 0.16} cy={cy} r={s * 0.34} color={c('#F79E89')} />
          <Circle cx={cx + s * 0.16} cy={cy} r={s * 0.34} color={c('#F79E89')} />
          {face(cy + s * 0.04, 0.5)}
        </Group>
      );
      break;
    case 'cat':
      charm = (
        <Group>
          <Path
            path={`M ${cx - s * 0.4} ${cy - s * 0.1} L ${cx - s * 0.34} ${cy - s * 0.5} L ${cx - s * 0.08} ${cy - s * 0.3} Z`}
            color={c('#E9A262')}
          />
          <Path
            path={`M ${cx + s * 0.4} ${cy - s * 0.1} L ${cx + s * 0.34} ${cy - s * 0.5} L ${cx + s * 0.08} ${cy - s * 0.3} Z`}
            color={c('#E9A262')}
          />
          <Circle cx={cx} cy={cy} r={s * 0.4} color={c('#F9B97C')} />
          {face(cy + s * 0.02, 0.55)}
        </Group>
      );
      break;
    case 'cloud':
      charm = (
        <Group>
          <Circle cx={cx - s * 0.24} cy={cy + s * 0.06} r={s * 0.24} color={c('#FFFFFF')} />
          <Circle cx={cx + s * 0.24} cy={cy + s * 0.06} r={s * 0.24} color={c('#FFFFFF')} />
          <Circle cx={cx} cy={cy - s * 0.08} r={s * 0.3} color={c('#FFFFFF')} />
          <RoundedRect
            x={cx - s * 0.46}
            y={cy + s * 0.02}
            width={s * 0.92}
            height={s * 0.28}
            r={s * 0.14}
            color={c('#FFFFFF')}
          />
          {face(cy + s * 0.04, 0.45)}
        </Group>
      );
      break;
    case 'rainbow':
      charm = (
        <Group>
          {['#F79E89', '#FFE29A', '#BDE7C9', '#A8D8F0'].map((col, i) => {
            const r = s * (0.46 - i * 0.1);
            return (
              <Path
                key={col}
                path={`M ${cx - r} ${cy + s * 0.2} a ${r} ${r} 0 0 1 ${r * 2} 0`}
                style="stroke"
                strokeWidth={s * 0.1}
                strokeCap="round"
                color={c(col)}
              />
            );
          })}
        </Group>
      );
      break;
    case 'sun':
      charm = (
        <Group>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <Path
                key={i}
                path={`M ${cx + Math.cos(a) * s * 0.36} ${cy + Math.sin(a) * s * 0.36} L ${cx + Math.cos(a) * s * 0.5} ${cy + Math.sin(a) * s * 0.5}`}
                style="stroke"
                strokeWidth={s * 0.08}
                strokeCap="round"
                color={c('#F6C177')}
              />
            );
          })}
          <Circle cx={cx} cy={cy} r={s * 0.3} color={c('#FFE29A')} />
          {face(cy, 0.42)}
        </Group>
      );
      break;
    case 'pencil':
      charm = (
        <Group>
          <RoundedRect
            x={cx - s * 0.14}
            y={cy - s * 0.42}
            width={s * 0.28}
            height={s * 0.62}
            r={s * 0.06}
            color={c('#FFE29A')}
          />
          <RoundedRect
            x={cx - s * 0.14}
            y={cy - s * 0.5}
            width={s * 0.28}
            height={s * 0.12}
            r={s * 0.06}
            color={c('#F7B6C8')}
          />
          <Path
            path={`M ${cx - s * 0.14} ${cy + s * 0.2} L ${cx} ${cy + s * 0.46} L ${cx + s * 0.14} ${cy + s * 0.2} Z`}
            color={c('#F2D0A4')}
          />
          <Path
            path={`M ${cx - s * 0.05} ${cy + s * 0.37} L ${cx} ${cy + s * 0.46} L ${cx + s * 0.05} ${cy + s * 0.37} Z`}
            color={c(INK)}
          />
          {locked ? null : (
            <Face cx={cx} cy={cy - s * 0.12} size={s * 0.3} expression="happy" ink={INK} blush={BLUSH} />
          )}
        </Group>
      );
      break;
    case 'trophy':
      charm = (
        <Group>
          <Path
            path={`M ${cx - s * 0.3} ${cy - s * 0.4} L ${cx + s * 0.3} ${cy - s * 0.4} Q ${cx + s * 0.3} ${cy + s * 0.12} ${cx} ${cy + s * 0.14} Q ${cx - s * 0.3} ${cy + s * 0.12} ${cx - s * 0.3} ${cy - s * 0.4} Z`}
            color={c('#F6C177')}
          />
          <RoundedRect
            x={cx - s * 0.05}
            y={cy + s * 0.12}
            width={s * 0.1}
            height={s * 0.16}
            r={2}
            color={c('#E8B060')}
          />
          <RoundedRect
            x={cx - s * 0.22}
            y={cy + s * 0.26}
            width={s * 0.44}
            height={s * 0.12}
            r={s * 0.05}
            color={c('#E8B060')}
          />
          <Path path={starPath(cx, cy - s * 0.16, s * 0.12)} color={locked ? '#CFC4BA' : '#FFFFFF'} />
        </Group>
      );
      break;
  }

  return (
    <Group>
      {withChain ? (
        <Group>
          <Circle
            cx={cx}
            cy={cy - s * 0.95}
            r={s * 0.14}
            style="stroke"
            strokeWidth={s * 0.05}
            color={c('#C9B7A6')}
          />
          {[0.78, 0.66, 0.54].map((t) => (
            <Oval
              key={t}
              x={cx - s * 0.04}
              y={cy - s * t - s * 0.06}
              width={s * 0.08}
              height={s * 0.12}
              style="stroke"
              strokeWidth={s * 0.035}
              color={c('#C9B7A6')}
            />
          ))}
        </Group>
      ) : null}
      {charm}
    </Group>
  );
}
