import {
  Circle,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';

import type { DecorSlot } from '@/data/decor';

import { shade } from '../color';
import { Face } from '../primitives/Face';

import { roomLayout, type Daylight, type RoomLayout } from './layout';

export { daylightFor, roomLayout, type Box, type Daylight, type RoomLayout } from './layout';

// The player's room, Style A. Pure Skia (no React Native imports) so it can
// be rendered headless by scripts/render-art-preview.tsx.

const SKY: Record<Daylight, [string, string]> = {
  morning: ['#BDE3F5', '#FFE9C7'],
  day: ['#A8D8F0', '#E6F6FF'],
  evening: ['#F7B6A0', '#CDB4F0'],
  night: ['#2B2F55', '#5B4A7A'],
};

interface Props {
  w: number;
  h: number;
  room: Record<DecorSlot, string>;
  isDark: boolean;
  daylight: Daylight;
  /** Next level's weekday label is drawn by React; this only draws the scene. */
}

export function RoomScene({ w, h, room, isDark, daylight }: Props) {
  const L = roomLayout(w, h);
  const night = daylight === 'night';
  const wall = isDark ? '#3A2F42' : '#FBE9DA';
  const floor = isDark ? '#5A4638' : '#E9CDAE';
  const ink = isDark ? '#3A2A26' : '#5B4636';

  return (
    <Group>
      {/* wall with a soft dotted wallpaper */}
      <Rect x={0} y={0} width={w} height={L.wallBottom} color={wall} />
      <Wallpaper L={L} color={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(247,158,137,0.10)'} />
      {/* floor */}
      <Rect x={0} y={L.wallBottom} width={w} height={h - L.wallBottom} color={floor} />
      <Rect x={0} y={L.wallBottom} width={w} height={6 * L.u} color={shade(floor, -0.08)} />
      {Array.from({ length: 5 }, (_, i) => (
        <Rect
          key={i}
          x={0}
          y={L.wallBottom + ((h - L.wallBottom) * (i + 1)) / 6}
          width={w}
          height={1.5 * L.u}
          color={shade(floor, -0.06)}
        />
      ))}

      <Window L={L} daylight={daylight} curtain={room.curtain} />
      <WallArt L={L} id={room.wall} isDark={isDark} />
      <Calendar L={L} isDark={isDark} />
      <Rug L={L} id={room.rug} isDark={isDark} />
      <Desk L={L} isDark={isDark} />
      <Lamp L={L} id={room.lamp} on={night || daylight === 'evening'} />
      <PencilCup L={L} />
      <Backpack L={L} ink={ink} isDark={isDark} />
      <Plant L={L} id={room.plant} ink={ink} />
      {night ? <Rect x={0} y={0} width={w} height={h} color="rgba(20,16,40,0.18)" /> : null}
    </Group>
  );
}

function Wallpaper({ L, color }: { L: RoomLayout; color: string }) {
  const step = 34 * L.u;
  const dots = [];
  for (let y = step / 2; y < L.wallBottom; y += step) {
    for (let x = (Math.round(y / step) % 2) * (step / 2); x < L.w; x += step) {
      dots.push(<Circle key={`${x},${y}`} cx={x} cy={y} r={2.2 * L.u} color={color} />);
    }
  }
  return <Group>{dots}</Group>;
}

function Window({ L, daylight, curtain }: { L: RoomLayout; daylight: Daylight; curtain: string }) {
  const { x, y, w, h } = L.window;
  const u = L.u;
  const [top, bottom] = SKY[daylight];
  const frame = '#FFFFFF';
  const curtainColor =
    curtain === 'curtain_lavender' ? '#CDB4F0' : curtain === 'curtain_butter' ? '#FFE29A' : '#BDE7C9';
  const cw = w * 0.2;
  return (
    <Group>
      <RoundedRect
        x={x - 6 * u}
        y={y - 6 * u}
        width={w + 12 * u}
        height={h + 12 * u}
        r={16 * u}
        color={frame}
      />
      <RoundedRect x={x} y={y} width={w} height={h} r={11 * u}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={[top, bottom]} />
      </RoundedRect>
      {daylight === 'night' ? (
        <Group>
          <Circle cx={x + w * 0.7} cy={y + h * 0.3} r={w * 0.09} color="#FFF3C4" />
          <Circle cx={x + w * 0.74} cy={y + h * 0.26} r={w * 0.08} color={top} />
          {[0.2, 0.35, 0.5, 0.28, 0.6].map((t, i) => (
            <Circle key={i} cx={x + w * t} cy={y + h * (0.2 + (i % 3) * 0.15)} r={1.6 * u} color="#FFF3C4" />
          ))}
        </Group>
      ) : (
        <Group>
          <Circle
            cx={x + w * 0.72}
            cy={y + h * 0.32}
            r={w * 0.1}
            color={daylight === 'evening' ? '#FFD7A8' : '#FFF1B8'}
          />
          <Oval
            x={x + w * 0.12}
            y={y + h * 0.5}
            width={w * 0.34}
            height={h * 0.16}
            color="rgba(255,255,255,0.85)"
          />
          <Oval
            x={x + w * 0.24}
            y={y + h * 0.42}
            width={w * 0.22}
            height={h * 0.16}
            color="rgba(255,255,255,0.85)"
          />
        </Group>
      )}
      {/* window cross */}
      <Rect x={x + w / 2 - 3 * u} y={y} width={6 * u} height={h} color={frame} />
      <Rect x={x} y={y + h / 2 - 3 * u} width={w} height={6 * u} color={frame} />
      {/* curtains */}
      <RoundedRect
        x={x - 14 * u}
        y={y - 12 * u}
        width={w + 28 * u}
        height={10 * u}
        r={5 * u}
        color={shade(curtainColor, -0.2)}
      />
      {[x - 12 * u, x + w - cw + 12 * u].map((cx, i) => (
        <Group key={i}>
          <RoundedRect x={cx} y={y - 8 * u} width={cw} height={h + 26 * u} r={12 * u} color={curtainColor} />
          {curtain === 'curtain_butter'
            ? Array.from({ length: 6 }, (_, k) => (
                <Circle
                  key={k}
                  cx={cx + cw * (k % 2 ? 0.65 : 0.35)}
                  cy={y + (h * (k + 0.5)) / 6}
                  r={2.6 * u}
                  color="#FFFFFF"
                  opacity={0.8}
                />
              ))
            : null}
          <RoundedRect
            x={cx + cw * 0.15}
            y={y + h * 0.55}
            width={cw * 0.7}
            height={6 * u}
            r={3 * u}
            color={shade(curtainColor, -0.25)}
          />
        </Group>
      ))}
    </Group>
  );
}

function WallArt({ L, id, isDark }: { L: RoomLayout; id: string; isDark: boolean }) {
  const { x, y, w, h } = L.wallArt;
  const u = L.u;
  const paper = isDark ? '#EFE4D2' : '#FFFBEF';
  const tape = 'rgba(205,180,240,0.7)';
  let content;
  if (id === 'wall_rainbow') {
    const colors = ['#F79E89', '#FFE29A', '#BDE7C9', '#A8D8F0'];
    content = colors.map((c, i) => {
      const r = w * (0.34 - i * 0.07);
      return (
        <Path
          key={c}
          path={`M ${x + w / 2 - r} ${y + h * 0.85} a ${r} ${r} 0 0 1 ${r * 2} 0`}
          style="stroke"
          strokeWidth={w * 0.06}
          strokeCap="round"
          color={c}
        />
      );
    });
  } else if (id === 'wall_cat') {
    const cx = x + w / 2;
    const cy = y + h * 0.58;
    const r = h * 0.3;
    content = (
      <Group>
        <Path
          path={`M ${cx - r * 0.9} ${cy - r * 0.4} l ${r * 0.1} ${-r * 0.9} l ${r * 0.6} ${r * 0.5} z`}
          color="#F9B97C"
        />
        <Path
          path={`M ${cx + r * 0.9} ${cy - r * 0.4} l ${-r * 0.1} ${-r * 0.9} l ${-r * 0.6} ${r * 0.5} z`}
          color="#F9B97C"
        />
        <Circle cx={cx} cy={cy} r={r} color="#F9B97C" />
        <Face cx={cx} cy={cy} size={r * 2} expression="happy" ink="#5B4636" blush="#F7A6A0" />
      </Group>
    );
  } else {
    // weekly timetable: little colored lesson blocks
    const cols = ['#A8D8F0', '#F79E89', '#BDE7C9', '#FFE29A', '#CDB4F0'];
    content = cols.map((c, i) =>
      [0, 1, 2].map((r) => (
        <RoundedRect
          key={`${i}-${r}`}
          x={x + w * 0.1 + i * w * 0.165}
          y={y + h * 0.28 + r * h * 0.22}
          width={w * 0.13}
          height={h * 0.16}
          r={3 * u}
          color={(i + r) % 3 === 0 ? c : shade(c, 0.05)}
          opacity={(i * 3 + r) % 4 === 0 ? 0.35 : 1}
        />
      )),
    );
  }
  return (
    <Group>
      <Group transform={[{ translateY: 3 * u }]} opacity={0.12}>
        <RoundedRect x={x} y={y} width={w} height={h} r={8 * u} color="#5B4636" />
      </Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={8 * u} color={paper} />
      {content}
      <RoundedRect
        x={x + w / 2 - 20 * u}
        y={y - 6 * u}
        width={40 * u}
        height={12 * u}
        r={2 * u}
        color={tape}
      />
    </Group>
  );
}

function Calendar({ L, isDark }: { L: RoomLayout; isDark: boolean }) {
  const { x, y, w, h } = L.calendar;
  const u = L.u;
  return (
    <Group>
      <Group transform={[{ translateY: 3 * u }]} opacity={0.12}>
        <RoundedRect x={x} y={y} width={w} height={h} r={8 * u} color="#5B4636" />
      </Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={8 * u} color={isDark ? '#EFE4D2' : '#FFFFFF'} />
      <RoundedRect x={x} y={y} width={w} height={h * 0.28} r={8 * u} color="#F79E89" />
      <Rect x={x} y={y + h * 0.16} width={w} height={h * 0.12} color="#F79E89" />
      {[0.25, 0.5, 0.75].map((t) => (
        <RoundedRect
          key={t}
          x={x + w * t - 2.5 * u}
          y={y - 5 * u}
          width={5 * u}
          height={12 * u}
          r={2.5 * u}
          color="#9C8574"
        />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <RoundedRect
          key={i}
          x={x + w * 0.1 + (i % 5) * w * 0.165}
          y={y + h * 0.4 + Math.floor(i / 5) * h * 0.28}
          width={w * 0.12}
          height={h * 0.18}
          r={2 * u}
          color={i < 3 ? '#BDE7C9' : 'rgba(91,70,54,0.1)'}
        />
      ))}
    </Group>
  );
}

function Desk({ L, isDark }: { L: RoomLayout; isDark: boolean }) {
  const { x, y, w, h } = L.desk;
  const wood = isDark ? '#8A6A55' : '#D9A77F';
  const legH = L.h * 0.26;
  return (
    <Group>
      {[x + w * 0.06, x + w * 0.9].map((lx) => (
        <RoundedRect
          key={lx}
          x={lx}
          y={y + h * 0.5}
          width={w * 0.04}
          height={legH}
          r={4 * L.u}
          color={shade(wood, -0.18)}
        />
      ))}
      <RoundedRect
        x={x + w * 0.62}
        y={y + h}
        width={w * 0.3}
        height={legH * 0.4}
        r={8 * L.u}
        color={shade(wood, -0.08)}
      />
      <RoundedRect
        x={x + w * 0.72}
        y={y + h + legH * 0.17}
        width={w * 0.1}
        height={5 * L.u}
        r={2.5 * L.u}
        color={shade(wood, -0.3)}
      />
      <RoundedRect x={x} y={y} width={w} height={h} r={h / 2} color={wood} />
      <RoundedRect
        x={x + 10 * L.u}
        y={y + 3 * L.u}
        width={w * 0.4}
        height={3 * L.u}
        r={1.5 * L.u}
        color="rgba(255,255,255,0.35)"
      />
    </Group>
  );
}

function Lamp({ L, id, on }: { L: RoomLayout; id: string; on: boolean }) {
  const { x, y, w, h } = L.lamp;
  const base = y + h;
  const glowAt = id === 'lamp_basic' ? vec(x + w * 0.62, y + h * 0.3) : vec(x + w / 2, y + h * 0.45);
  let body;
  if (id === 'lamp_mushroom') {
    body = (
      <Group>
        <RoundedRect
          x={x + w * 0.38}
          y={y + h * 0.45}
          width={w * 0.24}
          height={h * 0.5}
          r={w * 0.1}
          color="#FFF3E6"
        />
        <Path
          path={`M ${x} ${y + h * 0.5} Q ${x + w / 2} ${y - h * 0.05} ${x + w} ${y + h * 0.5} Z`}
          color="#F79E89"
        />
        {[0.3, 0.55, 0.72].map((t, i) => (
          <Circle key={t} cx={x + w * t} cy={y + h * (0.28 + (i % 2) * 0.1)} r={w * 0.06} color="#FFFFFF" />
        ))}
      </Group>
    );
  } else if (id === 'lamp_moon') {
    body = (
      <Group>
        <RoundedRect
          x={x + w * 0.33}
          y={y + h * 0.6}
          width={w * 0.08}
          height={h * 0.38}
          r={3}
          color="#CDB4F0"
        />
        <Circle cx={x + w / 2} cy={y + h * 0.42} r={w * 0.36} color="#FFE29A" />
        <Circle cx={x + w * 0.64} cy={y + h * 0.34} r={w * 0.3} color="rgba(0,0,0,0)" />
        <Face
          cx={x + w * 0.46}
          cy={y + h * 0.45}
          size={w * 0.5}
          expression="happy"
          ink="#5B4636"
          blush="#F7A6A0"
        />
      </Group>
    );
  } else {
    body = (
      <Group>
        <Path
          path={`M ${x + w * 0.3} ${base - 4} L ${x + w * 0.38} ${y + h * 0.35} L ${x + w * 0.6} ${y + h * 0.18}`}
          style="stroke"
          strokeWidth={5 * L.u}
          strokeCap="round"
          strokeJoin="round"
          color="#A8D8F0"
        />
        <Path
          path={`M ${x + w * 0.42} ${y + h * 0.1} L ${x + w * 0.95} ${y + h * 0.32} L ${x + w * 0.62} ${y + h * 0.46} Z`}
          color="#A8D8F0"
        />
      </Group>
    );
  }
  return (
    <Group>
      {on ? (
        <Circle cx={glowAt.x} cy={glowAt.y} r={w * 1.6}>
          <RadialGradient c={glowAt} r={w * 1.6} colors={['rgba(255,226,154,0.55)', 'rgba(255,226,154,0)']} />
        </Circle>
      ) : null}
      <RoundedRect
        x={x + w * 0.12}
        y={base - 8 * L.u}
        width={w * 0.5}
        height={8 * L.u}
        r={4 * L.u}
        color={shade('#A8D8F0', -0.15)}
      />
      {body}
    </Group>
  );
}

function PencilCup({ L }: { L: RoomLayout }) {
  const u = L.u;
  const x = L.w * 0.78;
  const bottom = L.deskTop;
  const colors = ['#F79E89', '#FFE29A', '#A8D8F0'];
  return (
    <Group>
      {colors.map((c, i) => (
        <RoundedRect
          key={c}
          x={x + 6 * u + i * 9 * u}
          y={bottom - 52 * u + (i % 2) * 8 * u}
          width={6 * u}
          height={30 * u}
          r={3 * u}
          color={c}
        />
      ))}
      <RoundedRect x={x} y={bottom - 30 * u} width={36 * u} height={30 * u} r={8 * u} color="#CDB4F0" />
    </Group>
  );
}

function Backpack({ L, ink, isDark }: { L: RoomLayout; ink: string; isDark: boolean }) {
  const { x, y, w, h } = L.backpack;
  const body = isDark ? '#B97F72' : '#F4B8A4';
  const dark = shade(body, -0.12);
  return (
    <Group>
      <Path
        path={`M ${x + w * 0.34} ${y + h * 0.1} q 0 ${-h * 0.2} ${w * 0.16} ${-h * 0.2} q ${w * 0.16} 0 ${w * 0.16} ${h * 0.2}`}
        style="stroke"
        strokeWidth={w * 0.07}
        strokeCap="round"
        color={dark}
      />
      <Group transform={[{ translateY: 4 * L.u }]} opacity={0.15}>
        <RoundedRect x={x} y={y} width={w} height={h} r={w * 0.26} color="#5B4636" />
      </Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={w * 0.26} color={body} />
      <RoundedRect
        x={x + w * 0.1}
        y={y + h * 0.12}
        width={w * 0.8}
        height={h * 0.07}
        r={h * 0.035}
        color="rgba(91,70,54,0.2)"
      />
      <Circle cx={x + w * 0.82} cy={y + h * 0.155} r={w * 0.045} color="#FFE29A" />
      {/* front pocket */}
      <RoundedRect
        x={x + w * 0.16}
        y={y + h * 0.58}
        width={w * 0.68}
        height={h * 0.34}
        r={w * 0.14}
        color={dark}
      />
      <RoundedRect
        x={x + w * 0.26}
        y={y + h * 0.64}
        width={w * 0.48}
        height={h * 0.03}
        r={2}
        color="rgba(255,255,255,0.45)"
      />
      <Face
        cx={x + w / 2}
        cy={y + h * 0.38}
        size={w * 0.55}
        expression="idle"
        ink={ink}
        blush={isDark ? '#E38E88' : '#F7A6A0'}
      />
    </Group>
  );
}

function Rug({ L, id, isDark }: { L: RoomLayout; id: string; isDark: boolean }) {
  const { cx, cy, rx, ry } = L.rug;
  if (id === 'rug_rainbow') {
    const colors = ['#F79E89', '#FFE29A', '#BDE7C9', '#A8D8F0', '#CDB4F0'];
    return (
      <Group opacity={isDark ? 0.85 : 1}>
        {colors.map((c, i) => (
          <Oval
            key={c}
            x={cx - rx * (1 - i * 0.17)}
            y={cy - ry * (1 - i * 0.17)}
            width={rx * 2 * (1 - i * 0.17)}
            height={ry * 2 * (1 - i * 0.17)}
            color={c}
          />
        ))}
      </Group>
    );
  }
  if (id === 'rug_cloud') {
    const cloud = isDark ? '#A99BC4' : '#EDE6FA';
    const puffs = [-0.5, -0.17, 0.17, 0.5];
    return (
      <Group>
        {puffs.map((t, i) => (
          <Oval
            key={t}
            x={cx + rx * t - rx * 0.3}
            y={cy - ry * (i % 2 ? 1.05 : 0.85)}
            width={rx * 0.6}
            height={ry * 1.8}
            color={cloud}
          />
        ))}
        <Oval x={cx - rx * 0.8} y={cy - ry * 0.55} width={rx * 1.6} height={ry * 1.35} color={cloud} />
        <Oval
          x={cx - rx * 0.55}
          y={cy - ry * 0.3}
          width={rx * 1.1}
          height={ry * 0.7}
          style="stroke"
          strokeWidth={2.5 * L.u}
          color="rgba(255,255,255,0.7)"
        />
      </Group>
    );
  }
  return (
    <Group opacity={isDark ? 0.85 : 1}>
      <Oval x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} color="#BDE7C9" />
      <Oval
        x={cx - rx * 0.78}
        y={cy - ry * 0.7}
        width={rx * 1.56}
        height={ry * 1.4}
        style="stroke"
        strokeWidth={3 * L.u}
        color="rgba(255,255,255,0.7)"
      />
    </Group>
  );
}

function Plant({ L, id, ink }: { L: RoomLayout; id: string; ink: string }) {
  if (id === 'plant_none') return null;
  const { x, y, w, h } = L.plant;
  const potTop = y + h * 0.62;
  const pot = (
    <Group>
      <Path
        path={`M ${x + w * 0.18} ${potTop} L ${x + w * 0.82} ${potTop} L ${x + w * 0.72} ${y + h} L ${x + w * 0.28} ${y + h} Z`}
        color="#F79E89"
      />
      <RoundedRect
        x={x + w * 0.12}
        y={potTop - h * 0.05}
        width={w * 0.76}
        height={h * 0.08}
        r={4 * L.u}
        color={shade('#F79E89', -0.1)}
      />
    </Group>
  );
  if (id === 'plant_cactus') {
    return (
      <Group>
        <RoundedRect
          x={x + w * 0.12}
          y={potTop - h * 0.4}
          width={w * 0.16}
          height={h * 0.2}
          r={w * 0.08}
          color="#9BD3A8"
        />
        <RoundedRect
          x={x + w * 0.12}
          y={potTop - h * 0.26}
          width={w * 0.3}
          height={w * 0.14}
          r={w * 0.07}
          color="#9BD3A8"
        />
        <RoundedRect
          x={x + w * 0.32}
          y={potTop - h * 0.55}
          width={w * 0.36}
          height={h * 0.55}
          r={w * 0.18}
          color="#9BD3A8"
        />
        <Face
          cx={x + w * 0.5}
          cy={potTop - h * 0.3}
          size={w * 0.34}
          expression="idle"
          ink={ink}
          blush="#F7A6A0"
        />
        {pot}
      </Group>
    );
  }
  // monstera
  const leaf = (angle: number, len: number) => {
    const bx = x + w / 2;
    const by = potTop;
    const tx = bx + Math.cos(angle) * len;
    const ty = by + Math.sin(angle) * len;
    return `M ${bx} ${by} Q ${(bx + tx) / 2 + 18 * L.u} ${(by + ty) / 2 - 10 * L.u} ${tx} ${ty} Q ${(bx + tx) / 2 - 18 * L.u} ${(by + ty) / 2 + 10 * L.u} ${bx} ${by} Z`;
  };
  return (
    <Group>
      {[-2.3, -1.95, -1.57, -1.2, -0.85].map((a, i) => (
        <Path key={a} path={leaf(a, h * (0.44 + (i % 2) * 0.1))} color={i % 2 ? '#8FC8A2' : '#9BD3A8'} />
      ))}
      {pot}
    </Group>
  );
}
