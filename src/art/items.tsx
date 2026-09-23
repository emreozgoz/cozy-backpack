import { Circle, Group, Oval, Path, RoundedRect } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';

import { shade, WHITE_SOFT } from './color';

// Style A item drawings: flat pastel, no outlines, a few soft details.
// Each drawer returns the details to paint over (or instead of) the shared
// rounded body, plus where the face goes.

export interface DrawCtx {
  /** Pixel size of the unrotated item. */
  w: number;
  h: number;
  /** Cell size in pixels. */
  c: number;
  /** Item base color for the current theme. */
  base: string;
  isDark: boolean;
  /** Filled cells of the unrotated shape (for non-rectangular items). */
  cells: { x: number; y: number }[];
}

export interface Drawing {
  /** Replaces the default rounded cell-union body (e.g. a round ball). */
  body?: ReactNode;
  /** Painted on top of the body. */
  details?: ReactNode;
  face?: { cx: number; cy: number; size: number };
  /** Short text printed on the cover (drawn by the React layer). */
  label?: { cx: number; cy: number; size: number };
}

const G = 3; // inset used by the body path

type Drawer = (d: DrawCtx) => Drawing;

const book: Drawer = ({ w, h, base }) => {
  const spine = w * 0.22;
  return {
    details: (
      <Group>
        <RoundedRect
          x={G}
          y={G}
          width={spine}
          height={h - G * 2}
          r={10}
          color={shade(base, -0.18)}
          opacity={0.7}
        />
        <RoundedRect x={w - G - 6} y={G + 8} width={3} height={h - G * 2 - 16} r={1.5} color={WHITE_SOFT} />
      </Group>
    ),
    label: { cx: spine + (w - spine) / 2, cy: h * 0.2, size: w * 0.2 },
    face: { cx: spine + (w - spine) / 2, cy: h * 0.56, size: w * 0.74 },
  };
};

const notebook: Drawer = ({ w, h, c, base }) => {
  const rings = Math.max(3, Math.floor(h / (c * 0.34)));
  return {
    details: (
      <Group>
        <RoundedRect
          x={G}
          y={G}
          width={w * 0.3}
          height={h - G * 2}
          r={8}
          color={shade(base, -0.12)}
          opacity={0.6}
        />
        {Array.from({ length: rings }, (_, i) => (
          <Circle
            key={i}
            cx={w * 0.24}
            cy={G + c * 0.25 + (i * (h - c * 0.5)) / (rings - 1)}
            r={Math.max(2, c * 0.05)}
            color={WHITE_SOFT}
          />
        ))}
        <RoundedRect
          x={w * 0.42}
          y={h * 0.12}
          width={w * 0.44}
          height={c * 0.26}
          r={4}
          color="rgba(255,255,255,0.8)"
        />
      </Group>
    ),
    face: { cx: w * 0.62, cy: h * 0.55, size: w * 0.72 },
  };
};

const pencilCase: Drawer = ({ w, h, base }) => {
  const zy = h * 0.34;
  const dark = shade(base, -0.3);
  return {
    details: (
      <Group>
        <RoundedRect x={h * 0.3} y={zy - 1.2} width={w - h * 0.9} height={2.4} r={1.2} color={dark} />
        <Circle cx={w - h * 0.55} cy={zy} r={h * 0.1} color={dark} />
        <RoundedRect x={w - h * 0.55 - 1.2} y={zy} width={2.4} height={h * 0.22} r={1.2} color={dark} />
      </Group>
    ),
    face: { cx: w * 0.42, cy: h * 0.6, size: h * 1.3 },
  };
};

const lunchbox: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.28);
  return {
    details: (
      <Group>
        <Path
          path={`M ${w * 0.34} ${h * 0.2} q 0 ${-h * 0.12} ${w * 0.16} ${-h * 0.12} q ${w * 0.16} 0 ${w * 0.16} ${h * 0.12}`}
          style="stroke"
          strokeWidth={Math.max(3, w * 0.04)}
          strokeCap="round"
          color={dark}
        />
        <RoundedRect
          x={G}
          y={h * 0.3}
          width={w - G * 2}
          height={Math.max(3, h * 0.04)}
          r={2}
          color={shade(base, -0.16)}
        />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.58, size: w * 0.85 },
  };
};

const bottle: Drawer = ({ w, h, base }) => ({
  details: (
    <Group>
      <RoundedRect x={w * 0.22} y={G} width={w * 0.56} height={h * 0.13} r={6} color={shade(base, -0.25)} />
      <RoundedRect
        x={G}
        y={h * 0.38}
        width={w - G * 2}
        height={h * 0.3}
        r={6}
        color="rgba(255,255,255,0.45)"
      />
      <RoundedRect x={w - G - 7} y={h * 0.18} width={3} height={h * 0.14} r={1.5} color={WHITE_SOFT} />
    </Group>
  ),
  face: { cx: w / 2, cy: h * 0.5, size: w * 0.8 },
});

const CRAYON_TIPS = ['#F79E89', '#A8D8F0', '#FFE29A', '#BDE7C9'];
const crayons: Drawer = ({ w, h, base }) => {
  const n = 4;
  const tipW = (w - G * 2 - 10) / n;
  return {
    body: (
      <Group>
        {CRAYON_TIPS.map((col, i) => (
          <Path
            key={col}
            path={`M ${G + 5 + i * tipW + 2} ${h * 0.36} v ${-h * 0.14} l ${tipW / 2 - 2} ${-h * 0.18} l ${tipW / 2 - 2} ${h * 0.18} v ${h * 0.14} z`}
            color={col}
          />
        ))}
        <RoundedRect
          x={G}
          y={h * 0.3}
          width={w - G * 2}
          height={h * 0.7 - G}
          r={Math.min(10, h * 0.2)}
          color={base}
        />
      </Group>
    ),
    details: <RoundedRect x={G + 6} y={h * 0.44} width={w * 0.3} height={3} r={1.5} color={WHITE_SOFT} />,
    face: { cx: w * 0.6, cy: h * 0.64, size: h * 1.1 },
  };
};

const sketchbook: Drawer = ({ w, h, c, base }) => {
  const rings = Math.max(4, Math.floor(w / (c * 0.4)));
  return {
    details: (
      <Group>
        {Array.from({ length: rings }, (_, i) => (
          <Circle
            key={i}
            cx={G + c * 0.3 + (i * (w - c * 0.6 - G * 2)) / (rings - 1)}
            cy={G + c * 0.2}
            r={Math.max(2.5, c * 0.06)}
            color={WHITE_SOFT}
          />
        ))}
        {/* a little painting on the cover */}
        <RoundedRect
          x={w * 0.14}
          y={h * 0.2}
          width={w * 0.72}
          height={h * 0.34}
          r={10}
          color="rgba(255,255,255,0.55)"
        />
        <Circle cx={w * 0.7} cy={h * 0.3} r={c * 0.14} color="#FFE29A" />
        <Path
          path={`M ${w * 0.18} ${h * 0.5} q ${w * 0.16} ${-h * 0.16} ${w * 0.3} 0 q ${w * 0.12} ${-h * 0.1} ${w * 0.34} 0 z`}
          color="#BDE7C9"
        />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.72, size: w * 0.55 },
  };
};

const flute: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.3);
  return {
    details: (
      <Group>
        <RoundedRect x={G} y={G} width={w - G * 2} height={h * 0.1} r={6} color={shade(base, -0.12)} />
        {[0.48, 0.58, 0.68, 0.78, 0.88].map((t) => (
          <Circle key={t} cx={w / 2} cy={h * t} r={Math.max(2, w * 0.07)} color={dark} />
        ))}
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.25, size: w * 0.8 },
  };
};

const toyCar: Drawer = ({ w, h, base }) => {
  const wheel = h * 0.17;
  return {
    body: (
      <Group>
        <RoundedRect
          x={w * 0.22}
          y={h * 0.12}
          width={w * 0.5}
          height={h * 0.4}
          r={h * 0.14}
          color={shade(base, -0.08)}
        />
        <RoundedRect x={G} y={h * 0.36} width={w - G * 2} height={h * 0.42} r={h * 0.16} color={base} />
        <Circle cx={w * 0.27} cy={h * 0.8} r={wheel} color="#5B4636" />
        <Circle cx={w * 0.73} cy={h * 0.8} r={wheel} color="#5B4636" />
        <Circle cx={w * 0.27} cy={h * 0.8} r={wheel * 0.4} color="#D8CFC4" />
        <Circle cx={w * 0.73} cy={h * 0.8} r={wheel * 0.4} color="#D8CFC4" />
      </Group>
    ),
    details: (
      <RoundedRect
        x={w * 0.3}
        y={h * 0.18}
        width={w * 0.34}
        height={h * 0.22}
        r={h * 0.08}
        color="rgba(255,255,255,0.7)"
      />
    ),
    face: { cx: w * 0.5, cy: h * 0.54, size: h * 1.0 },
  };
};

const ball: Drawer = ({ w, h, base }) => {
  const r = Math.min(w, h) / 2 - G;
  const cx = w / 2;
  const cy = h / 2;
  return {
    body: <Circle cx={cx} cy={cy} r={r} color={base} />,
    details: (
      <Group>
        <Path
          path={`M ${cx - r} ${cy - r * 0.2} q ${r} ${r * 0.5} ${r * 2} 0`}
          style="stroke"
          strokeWidth={Math.max(3, r * 0.1)}
          color={shade(base, -0.2)}
        />
        <Oval x={cx - r * 0.6} y={cy - r * 0.75} width={r * 0.45} height={r * 0.25} color={WHITE_SOFT} />
      </Group>
    ),
    face: { cx, cy: cy + r * 0.25, size: r * 1.5 },
  };
};

const comic: Drawer = ({ w, h, base }) => {
  const cx = w / 2;
  const cy = h * 0.34;
  const R = Math.min(w, h) * 0.22;
  const star = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 ? R * 0.62 : R;
    return `${i ? 'L' : 'M'} ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
  }).join(' ');
  return {
    details: (
      <Group>
        <Path path={`${star} Z`} color="#FFE29A" />
        <RoundedRect x={G + 6} y={h * 0.62} width={w * 0.5} height={3} r={1.5} color={WHITE_SOFT} />
        <RoundedRect x={G + 6} y={h * 0.7} width={w * 0.34} height={3} r={1.5} color={WHITE_SOFT} />
        <RoundedRect
          x={w - G - 6}
          y={G + 8}
          width={3}
          height={h - G * 2 - 16}
          r={1.5}
          color={shade(base, -0.15)}
        />
      </Group>
    ),
    face: { cx: w * 0.62, cy: h * 0.72, size: w * 0.45 },
  };
};

const plush: Drawer = ({ w, h, base }) => {
  const head = w * 0.38;
  const cx = w / 2;
  const hy = h * 0.3;
  return {
    body: (
      <Group>
        <Circle cx={cx - head * 0.75} cy={hy - head * 0.72} r={head * 0.34} color={shade(base, -0.08)} />
        <Circle cx={cx + head * 0.75} cy={hy - head * 0.72} r={head * 0.34} color={shade(base, -0.08)} />
        <RoundedRect
          x={G + 2}
          y={h * 0.46}
          width={w - G * 2 - 4}
          height={h * 0.54 - G}
          r={w * 0.3}
          color={shade(base, -0.05)}
        />
        <Circle cx={cx} cy={hy} r={head} color={base} />
      </Group>
    ),
    details: (
      <Oval
        x={cx - w * 0.14}
        y={h * 0.62}
        width={w * 0.28}
        height={h * 0.18}
        color="rgba(255,255,255,0.45)"
      />
    ),
    face: { cx, cy: hy, size: head * 1.6 },
  };
};

const cards: Drawer = ({ w, h }) => {
  const s = Math.min(w, h) * 0.18;
  const cx = w / 2;
  const cy = h * 0.34;
  return {
    details: (
      <Path
        path={`M ${cx} ${cy + s} C ${cx - s * 1.8} ${cy - s * 0.2} ${cx - s * 0.6} ${cy - s * 1.4} ${cx} ${cy - s * 0.4} C ${cx + s * 0.6} ${cy - s * 1.4} ${cx + s * 1.8} ${cy - s * 0.2} ${cx} ${cy + s} Z`}
        color="#F79E89"
      />
    ),
    face: { cx, cy: h * 0.66, size: w * 0.6 },
  };
};

const gift: Drawer = ({ w, h, base }) => {
  const ribbon = shade(base, -0.25);
  return {
    details: (
      <Group>
        <RoundedRect x={w * 0.44} y={G} width={w * 0.12} height={h - G * 2} r={2} color={ribbon} />
        <RoundedRect x={G} y={h * 0.3} width={w - G * 2} height={h * 0.1} r={2} color={ribbon} />
        <Oval x={w * 0.3} y={G + 2} width={w * 0.2} height={h * 0.16} color={ribbon} />
        <Oval x={w * 0.5} y={G + 2} width={w * 0.2} height={h * 0.16} color={ribbon} />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.66, size: w * 0.7 },
  };
};

const generic: Drawer = ({ w, h, c, cells }) => {
  const rect = cells.length === (w / c) * (h / c);
  // Non-rectangular shapes: put the face on the bottom-left-most full cell.
  const anchor = rect ? null : [...cells].sort((a, b) => b.y - a.y || a.x - b.x)[0];
  return {
    details: (
      <RoundedRect
        x={w * 0.16}
        y={h * 0.14}
        width={w * 0.26}
        height={Math.max(3, h * 0.05)}
        r={2}
        color={WHITE_SOFT}
      />
    ),
    face: anchor
      ? { cx: (anchor.x + 0.5) * c, cy: (anchor.y + 0.5) * c, size: c * 0.8 }
      : { cx: w / 2, cy: h / 2, size: Math.min(w, h) * 0.8 },
  };
};

const drawers: Record<string, Drawer> = {
  book,
  notebook,
  pencilCase,
  lunchbox,
  bottle,
  crayons,
  sketchbook,
  flute,
  toyCar,
  ball,
  comic,
  plush,
  cards,
  gift,
};

export function drawItem(sprite: string, ctx: DrawCtx): Drawing {
  return (drawers[sprite] ?? generic)(ctx);
}
