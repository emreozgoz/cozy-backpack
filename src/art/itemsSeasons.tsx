import { Circle, Group, Oval, Path, RoundedRect } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';

import { shade, WHITE_SOFT } from './color';
import type { DrawCtx, Drawing } from './items';

// Style A drawings for the work, campus and holiday seasons (weeks 7–18).
// Same rules as items.tsx: flat pastel, no outlines, a face on every item.

const G = 3;
type Drawer = (d: DrawCtx) => Drawing;

const INK = '#5B4636';

/** Face on the bottom-left full cell for L-shaped folds, centred otherwise. */
function softFace({ w, h, c, cells }: DrawCtx, scale = 0.8): Drawing['face'] {
  const rect = cells.length === Math.round(w / c) * Math.round(h / c);
  if (rect) return { cx: w / 2, cy: h * 0.58, size: Math.min(w, h) * scale };
  const a = [...cells].sort((p, q) => q.y - p.y || p.x - q.x)[0];
  return { cx: (a.x + 0.5) * c, cy: (a.y + 0.5) * c, size: c * 0.8 };
}

// ── Work ────────────────────────────────────────────────────────────────

const laptop: Drawer = ({ w, h, c, base }) => ({
  details: (
    <Group>
      <RoundedRect x={G + 6} y={G + 6} width={w - G * 2 - 12} height={h * 0.62} r={8} color={shade(base, 0.22)} />
      <RoundedRect x={G} y={h * 0.8} width={w - G * 2} height={h * 0.2 - G} r={6} color={shade(base, -0.14)} />
      <RoundedRect x={w * 0.42} y={h * 0.86} width={w * 0.16} height={3} r={1.5} color={shade(base, -0.3)} />
      <Circle cx={w - G - c * 0.3} cy={G + c * 0.28} r={Math.max(2, c * 0.05)} color="#BDE7C9" />
    </Group>
  ),
  face: { cx: w / 2, cy: h * 0.42, size: w * 0.42 },
});

const folder: Drawer = ({ w, h, c, base }) => ({
  body: (
    <Group>
      <RoundedRect x={G + 4} y={G} width={w * 0.42} height={c * 0.4} r={8} color={shade(base, -0.1)} />
      <RoundedRect x={w * 0.2} y={G + c * 0.12} width={w * 0.66} height={h * 0.3} r={4} color="#FFFFFF" />
      <RoundedRect x={G} y={G + c * 0.24} width={w - G * 2} height={h - G * 2 - c * 0.24} r={10} color={base} />
    </Group>
  ),
  details: (
    <RoundedRect x={w * 0.22} y={h * 0.2} width={w * 0.56} height={c * 0.22} r={4} color="rgba(255,255,255,0.8)" />
  ),
  label: { cx: w / 2, cy: h * 0.24, size: w * 0.14 },
  face: { cx: w / 2, cy: h * 0.6, size: w * 0.7 },
});

const tablet: Drawer = ({ w, h, base }) => ({
  details: (
    <Group>
      <RoundedRect x={G + 7} y={G + 7} width={w - G * 2 - 14} height={h - G * 2 - 22} r={8} color={shade(base, 0.24)} />
      <Circle cx={w / 2} cy={h - G - 8} r={3} color={shade(base, -0.25)} />
    </Group>
  ),
  label: { cx: w * 0.78, cy: h * 0.22, size: w * 0.1 },
  face: { cx: w / 2, cy: h * 0.5, size: w * 0.62 },
});

const agenda: Drawer = ({ w, h, base }) => ({
  details: (
    <Group>
      <RoundedRect x={w * 0.8} y={G} width={Math.max(4, w * 0.06)} height={h - G * 2} r={2} color={shade(base, -0.28)} />
      <Path path={`M ${w * 0.2} ${G} v ${h * 0.24} l ${w * 0.05} ${-h * 0.05} l ${w * 0.05} ${h * 0.05} v ${-h * 0.24} z`} color="#FFE29A" />
    </Group>
  ),
  label: { cx: w * 0.5, cy: h * 0.24, size: w * 0.14 },
  face: { cx: w * 0.46, cy: h * 0.62, size: w * 0.62 },
});

const thermos: Drawer = ({ w, h, base }) => ({
  details: (
    <Group>
      <RoundedRect x={G + 2} y={G} width={w - G * 2 - 4} height={h * 0.16} r={8} color={shade(base, -0.28)} />
      <RoundedRect x={G} y={h * 0.7} width={w - G * 2} height={h * 0.06} r={2} color={shade(base, -0.14)} />
      <RoundedRect x={w - G - 8} y={h * 0.24} width={3} height={h * 0.26} r={1.5} color={WHITE_SOFT} />
    </Group>
  ),
  face: { cx: w / 2, cy: h * 0.46, size: w * 0.8 },
});

const charger: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.35);
  return {
    body: (
      <Group>
        <RoundedRect x={w * 0.34} y={G} width={w * 0.07} height={h * 0.24} r={2} color={dark} />
        <RoundedRect x={w * 0.59} y={G} width={w * 0.07} height={h * 0.24} r={2} color={dark} />
        <RoundedRect x={G + 4} y={h * 0.2} width={w - G * 2 - 8} height={h * 0.8 - G} r={10} color={base} />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.6, size: w * 0.7 },
  };
};

const businessCards: Drawer = ({ w, h }) => ({
  body: (
    <Group>
      <RoundedRect x={G + 6} y={G + 2} width={w - G * 2 - 8} height={h * 0.64} r={5} color="#E9E1D6" />
      <RoundedRect x={G + 2} y={G + 8} width={w - G * 2 - 8} height={h * 0.64} r={5} color="#FFFBEF" />
    </Group>
  ),
  details: (
    <Group>
      <RoundedRect x={G + 8} y={h * 0.26} width={w * 0.36} height={2.5} r={1} color="#F79E89" />
      <RoundedRect x={G + 8} y={h * 0.34} width={w * 0.24} height={2} r={1} color="#C9BBAA" />
    </Group>
  ),
  face: { cx: w * 0.52, cy: h * 0.52, size: w * 0.5 },
});

const umbrella: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.22);
  return {
    body: (
      <Group>
        <Path
          path={`M ${w / 2} ${G} L ${w - G - 2} ${h * 0.72} Q ${w / 2} ${h * 0.78} ${G + 2} ${h * 0.72} Z`}
          color={base}
        />
        <RoundedRect x={w / 2 - 2} y={h * 0.7} width={4} height={h * 0.2} r={2} color={INK} />
        <Path
          path={`M ${w / 2} ${h * 0.88} q 0 ${h * 0.08} ${-w * 0.2} ${h * 0.08} q ${-w * 0.14} 0 ${-w * 0.14} ${-h * 0.05}`}
          style="stroke"
          strokeWidth={4}
          strokeCap="round"
          color={INK}
        />
      </Group>
    ),
    details: (
      <Group>
        <Path path={`M ${w / 2} ${G + 6} L ${w / 2 + 2} ${h * 0.72}`} style="stroke" strokeWidth={2} color={dark} />
        <RoundedRect x={w * 0.22} y={h * 0.58} width={w * 0.56} height={h * 0.035} r={2} color={dark} />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.42, size: w * 0.6 },
  };
};

const gameConsole: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.3);
  const s = h * 0.1;
  return {
    body: <RoundedRect x={G} y={G + 2} width={w - G * 2} height={h - G * 2 - 4} r={h * 0.3} color={base} />,
    details: (
      <Group>
        <RoundedRect x={w * 0.3} y={h * 0.22} width={w * 0.4} height={h * 0.56} r={6} color={shade(base, 0.35)} />
        <RoundedRect x={w * 0.14 - s * 1.5} y={h / 2 - s / 2} width={s * 3} height={s} r={1.5} color={dark} />
        <RoundedRect x={w * 0.14 - s / 2} y={h / 2 - s * 1.5} width={s} height={s * 3} r={1.5} color={dark} />
        <Circle cx={w * 0.84} cy={h * 0.4} r={s * 0.7} color="#FFE29A" />
        <Circle cx={w * 0.9} cy={h * 0.6} r={s * 0.7} color="#A8D8F0" />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.52, size: w * 0.3 },
  };
};

const magazine: Drawer = ({ w, h, base }) => ({
  details: (
    <Group>
      <RoundedRect x={G} y={G} width={w - G * 2} height={h * 0.22} r={10} color={shade(base, -0.16)} />
      <RoundedRect x={w * 0.14} y={h * 0.09} width={w * 0.5} height={h * 0.06} r={2} color="#FFFFFF" />
      <Circle cx={w * 0.78} cy={h * 0.42} r={w * 0.08} color="#FFE29A" />
      <RoundedRect x={w * 0.12} y={h * 0.84} width={w * 0.4} height={3} r={1.5} color={WHITE_SOFT} />
    </Group>
  ),
  face: { cx: w * 0.44, cy: h * 0.56, size: w * 0.56 },
});

// ── Campus ──────────────────────────────────────────────────────────────

const coffee: Drawer = ({ w, h, base }) => ({
  body: (
    <Group>
      <Path
        path={`M ${G + 4} ${h * 0.16} L ${w - G - 4} ${h * 0.16} L ${w - G - 9} ${h - G} L ${G + 9} ${h - G} Z`}
        color="#FFFBEF"
      />
      <RoundedRect x={G} y={G + 2} width={w - G * 2} height={h * 0.14} r={6} color={shade(base, -0.2)} />
    </Group>
  ),
  details: (
    <Group>
      <Path
        path={`M ${G + 6} ${h * 0.4} L ${w - G - 6} ${h * 0.4} L ${w - G - 8} ${h * 0.72} L ${G + 8} ${h * 0.72} Z`}
        color={base}
      />
      <Path
        path={`M ${w * 0.4} ${G + 2} q ${-w * 0.08} ${-h * 0.03} 0 ${-h * 0.06}`}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        color={WHITE_SOFT}
      />
    </Group>
  ),
  face: { cx: w / 2, cy: h * 0.56, size: w * 0.6 },
});

const labCoat: Drawer = (d) => {
  const { w, h, c, base } = d;
  const dark = shade(base, -0.14);
  return {
    details: (
      <Group>
        <Path
          path={`M ${w / 2 - c * 0.3} ${G} L ${w / 2} ${G + c * 0.4} L ${w / 2 + c * 0.3} ${G} Z`}
          color={dark}
        />
        {[0.55, 0.72, 0.89].map((t) => (
          <Circle key={t} cx={w / 2} cy={Math.min(h * t, h - c * 0.2)} r={Math.max(2, c * 0.05)} color="#A8D8F0" />
        ))}
        <RoundedRect x={G + 6} y={h - c * 0.45} width={c * 0.32} height={c * 0.22} r={3} color={dark} />
      </Group>
    ),
    face: softFace(d, 0.62),
  };
};

const goggles: Drawer = ({ w, h, base }) => {
  const r = h * 0.3;
  return {
    body: (
      <Group>
        <RoundedRect x={G} y={h * 0.4} width={w - G * 2} height={h * 0.16} r={4} color={shade(base, -0.2)} />
        <RoundedRect x={w * 0.14} y={h / 2 - r - 2} width={w * 0.72} height={r * 2 + 4} r={r} color={base} />
      </Group>
    ),
    details: (
      <Group>
        <Circle cx={w * 0.33} cy={h / 2} r={r * 0.78} color="rgba(255,255,255,0.6)" />
        <Circle cx={w * 0.67} cy={h / 2} r={r * 0.78} color="rgba(255,255,255,0.6)" />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.54, size: h * 0.7 },
  };
};

const portfolio: Drawer = ({ w, h, c, base }) => {
  const dark = shade(base, -0.24);
  return {
    body: (
      <Group>
        <Path
          path={`M ${w * 0.42} ${c * 0.3} v ${-c * 0.18} q 0 ${-c * 0.08} ${c * 0.08} ${-c * 0.08} h ${w * 0.16 - c * 0.16} q ${c * 0.08} 0 ${c * 0.08} ${c * 0.08} v ${c * 0.18}`}
          style="stroke"
          strokeWidth={Math.max(3, c * 0.08)}
          color={dark}
        />
        <RoundedRect x={G} y={c * 0.28} width={w - G * 2} height={h - c * 0.28 - G} r={12} color={base} />
      </Group>
    ),
    details: (
      <Group>
        <RoundedRect x={G} y={h * 0.44} width={w - G * 2} height={3} r={1.5} color={dark} />
        <RoundedRect x={w * 0.62} y={h * 0.2} width={w * 0.28} height={h * 0.2} r={4} color="rgba(255,255,255,0.7)" />
      </Group>
    ),
    label: { cx: w * 0.76, cy: h * 0.3, size: h * 0.12 },
    face: { cx: w * 0.36, cy: h * 0.62, size: h * 0.76 },
  };
};

// ── Holiday ─────────────────────────────────────────────────────────────

const tshirt: Drawer = (d) => {
  const { w, c, base } = d;
  const dark = shade(base, -0.18);
  return {
    details: (
      <Group>
        <Path
          path={`M ${w / 2 - c * 0.28} ${G} q ${c * 0.28} ${c * 0.3} ${c * 0.56} 0`}
          style="stroke"
          strokeWidth={Math.max(3, c * 0.08)}
          strokeCap="round"
          color={dark}
        />
        <RoundedRect x={G + 4} y={c * 0.5} width={c * 0.26} height={3} r={1.5} color={WHITE_SOFT} />
      </Group>
    ),
    face: softFace(d, 0.62),
  };
};

const sweater: Drawer = (d) => {
  const { w, h, c, base, cells } = d;
  const dark = shade(base, -0.16);
  const cols = new Set(cells.filter((k) => k.y === Math.max(...cells.map((q) => q.y))).map((k) => k.x));
  const cuffW = cols.size * c - G * 2;
  return {
    details: (
      <Group>
        <RoundedRect x={G} y={h - G - c * 0.2} width={cuffW} height={c * 0.2} r={6} color={dark} />
        {Array.from({ length: Math.floor(cuffW / 8) }, (_, i) => (
          <RoundedRect key={i} x={G + 6 + i * 8} y={h - G - c * 0.17} width={2} height={c * 0.14} r={1} color={shade(base, -0.28)} />
        ))}
        <RoundedRect x={w * 0.36} y={G} width={Math.min(w * 0.28, c * 0.9)} height={c * 0.14} r={5} color={dark} />
      </Group>
    ),
    face: softFace(d, 0.62),
  };
};

const dress: Drawer = (d) => {
  const { w, c, base } = d;
  return {
    details: (
      <Group>
        <RoundedRect x={G} y={c * 0.8} width={Math.min(w, c) - G * 2} height={c * 0.12} r={3} color={shade(base, -0.2)} />
        <Circle cx={c * 0.3} cy={c * 0.86} r={c * 0.09} color="#FFE29A" />
      </Group>
    ),
    face: softFace(d, 0.7),
  };
};

const towel: Drawer = (d) => {
  const { c, cells } = d;
  return {
    details: (
      <Group>
        {cells.map((k) => (
          <Group key={`${k.x},${k.y}`}>
            <RoundedRect x={k.x * c + c * 0.2} y={k.y * c + G} width={c * 0.12} height={c - G * 2} r={2} color="#F79E89" opacity={0.55} />
            <RoundedRect x={k.x * c + c * 0.68} y={k.y * c + G} width={c * 0.12} height={c - G * 2} r={2} color="#A8D8F0" opacity={0.6} />
          </Group>
        ))}
      </Group>
    ),
    face: softFace(d, 0.62),
  };
};

const shoes: Drawer = ({ w, h, base }) => ({
  body: (
    <Group>
      <RoundedRect x={G} y={h * 0.34} width={w - G * 2} height={h * 0.62 - G} r={h * 0.26} color={base} />
      <RoundedRect x={G} y={h * 0.14} width={w * 0.44} height={h * 0.5} r={h * 0.2} color={base} />
    </Group>
  ),
  details: (
    <Group>
      <RoundedRect x={G} y={h * 0.82} width={w - G * 2} height={h * 0.14 - G} r={4} color="#FFFBEF" />
      {[0.18, 0.28, 0.38].map((t) => (
        <RoundedRect key={t} x={w * t} y={h * 0.26} width={w * 0.05} height={h * 0.1} r={1.5} color={WHITE_SOFT} />
      ))}
    </Group>
  ),
  face: { cx: w * 0.66, cy: h * 0.58, size: h * 0.8 },
});

const swimsuit: Drawer = ({ w, h }) => ({
  details: (
    <Group>
      {[
        [0.22, 0.24],
        [0.78, 0.22],
        [0.2, 0.8],
        [0.8, 0.78],
      ].map(([x, y]) => (
        <Circle key={`${x}${y}`} cx={w * x} cy={h * y} r={Math.max(2, w * 0.06)} color="#FFFFFF" opacity={0.7} />
      ))}
    </Group>
  ),
  face: { cx: w / 2, cy: h * 0.52, size: w * 0.7 },
});

const tube = (cap: string, mark: (w: number, h: number) => ReactNode): Drawer =>
  function Tube({ w, h }) {
    return {
      details: (
        <Group>
          <RoundedRect x={w * 0.26} y={G} width={w * 0.48} height={h * 0.16} r={5} color={cap} />
          {mark(w, h)}
        </Group>
      ),
      face: { cx: w / 2, cy: h * 0.62, size: w * 0.7 },
    };
  };

const sunscreen = tube('#F79E89', (w, h) => <Circle cx={w / 2} cy={h * 0.32} r={w * 0.12} color="#FFFFFF" opacity={0.85} />);
const shampoo = tube('#A8D8F0', (w, h) => (
  <Group>
    <Circle cx={w * 0.34} cy={h * 0.32} r={w * 0.07} color="#FFFFFF" opacity={0.8} />
    <Circle cx={w * 0.58} cy={h * 0.28} r={w * 0.1} color="#FFFFFF" opacity={0.8} />
  </Group>
));

const toiletry: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.3);
  return {
    details: (
      <Group>
        <RoundedRect x={h * 0.3} y={h * 0.3} width={w - h * 0.6} height={2.4} r={1.2} color={dark} />
        <Circle cx={w - h * 0.3} cy={h * 0.3} r={h * 0.09} color={dark} />
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <Circle key={t} cx={w * t} cy={h * 0.84} r={2} color={WHITE_SOFT} />
        ))}
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.6, size: h * 1.1 },
  };
};

const hat: Drawer = ({ w, h, base }) => ({
  body: (
    <Group>
      <Oval x={G} y={h * 0.56} width={w - G * 2} height={h * 0.4} color={base} />
      <RoundedRect x={w * 0.24} y={G + 2} width={w * 0.52} height={h * 0.72} r={w * 0.2} color={base} />
    </Group>
  ),
  details: (
    <Group>
      <RoundedRect x={w * 0.24} y={h * 0.48} width={w * 0.52} height={h * 0.12} r={2} color="#F79E89" />
      <Path path={`M ${w * 0.3} ${h * 0.7} q ${w * 0.2} ${h * 0.08} ${w * 0.4} 0`} style="stroke" strokeWidth={1.5} color={shade(base, -0.2)} />
    </Group>
  ),
  face: { cx: w / 2, cy: h * 0.3, size: h * 0.55 },
});

const boots: Drawer = ({ w, h, base }) => {
  const dark = shade(base, -0.3);
  return {
    details: (
      <Group>
        <RoundedRect x={G} y={h * 0.84} width={w - G * 2} height={h * 0.16 - G} r={6} color={dark} />
        {[0.16, 0.3, 0.44].map((t) => (
          <Path
            key={t}
            path={`M ${w * 0.62} ${h * t} l ${w * 0.2} ${h * 0.06} M ${w * 0.82} ${h * t} l ${-w * 0.2} ${h * 0.06}`}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            color="#FFFBEF"
          />
        ))}
      </Group>
    ),
    face: { cx: w * 0.36, cy: h * 0.5, size: w * 0.5 },
  };
};

const camera: Drawer = ({ w, h, base }) => {
  const r = h * 0.3;
  return {
    body: (
      <Group>
        <RoundedRect x={w * 0.14} y={G} width={w * 0.2} height={h * 0.3} r={4} color={shade(base, -0.2)} />
        <RoundedRect x={G} y={h * 0.18} width={w - G * 2} height={h * 0.82 - G} r={10} color={base} />
      </Group>
    ),
    details: (
      <Group>
        <Circle cx={w * 0.62} cy={h * 0.58} r={r} color={shade(base, -0.35)} />
        <Circle cx={w * 0.62} cy={h * 0.58} r={r * 0.62} color="#A8D8F0" />
        <Circle cx={w * 0.58} cy={h * 0.52} r={r * 0.18} color="#FFFFFF" />
        <RoundedRect x={w * 0.8} y={h * 0.26} width={w * 0.1} height={h * 0.1} r={2} color="#FFE29A" />
      </Group>
    ),
    face: { cx: w * 0.24, cy: h * 0.62, size: h * 0.62 },
  };
};

const guidebook: Drawer = ({ w, h, base }) => {
  const spine = w * 0.2;
  return {
    details: (
      <Group>
        <RoundedRect x={G} y={G} width={spine} height={h - G * 2} r={10} color={shade(base, -0.18)} opacity={0.7} />
        {/* folded map sticking out */}
        <Path path={`M ${w - G - w * 0.26} ${h - G} l ${w * 0.26} ${-w * 0.26} v ${w * 0.26} z`} color="#FFE29A" />
        <Circle cx={w - G - w * 0.08} cy={h - G - w * 0.08} r={2.5} color="#F79E89" />
      </Group>
    ),
    label: { cx: spine + (w - spine) / 2, cy: h * 0.22, size: w * 0.16 },
    face: { cx: spine + (w - spine) / 2, cy: h * 0.58, size: w * 0.6 },
  };
};

const souvenir: Drawer = ({ w, h, base }) => {
  const r = w * 0.36;
  return {
    body: (
      <Group>
        <Path path={`M ${w * 0.18} ${h - G} L ${w * 0.26} ${h * 0.7} L ${w * 0.74} ${h * 0.7} L ${w * 0.82} ${h - G} Z`} color={shade(base, -0.2)} />
        <Circle cx={w / 2} cy={G + r + 2} r={r} color="#DDF1FA" />
      </Group>
    ),
    details: (
      <Group>
        <Path path={`M ${w * 0.3} ${h * 0.62} q ${w * 0.2} ${-h * 0.12} ${w * 0.4} 0 z`} color="#FFFFFF" />
        <Path path={`M ${w * 0.44} ${h * 0.58} l ${w * 0.06} ${-h * 0.2} l ${w * 0.06} ${h * 0.2} z`} color={base} />
        {[
          [0.3, 0.26],
          [0.66, 0.22],
          [0.72, 0.44],
          [0.34, 0.46],
        ].map(([x, y]) => (
          <Circle key={`${x}${y}`} cx={w * x} cy={h * y} r={2} color="#FFFFFF" />
        ))}
        <Oval x={w * 0.3} y={G + 8} width={w * 0.16} height={h * 0.08} color={WHITE_SOFT} />
      </Group>
    ),
    face: { cx: w / 2, cy: h * 0.86, size: w * 0.36 },
  };
};

const swimRing: Drawer = ({ w, h, base }) => {
  const r = Math.min(w, h) / 2 - G;
  const t = r * 0.36;
  const cx = w / 2;
  const cy = h / 2;
  return {
    body: <Circle cx={cx} cy={cy} r={r - t / 2} style="stroke" strokeWidth={t} color={base} />,
    details: (
      <Group>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const px = cx + Math.cos(a) * (r - t / 2);
          const py = cy + Math.sin(a) * (r - t / 2);
          return <Circle key={i} cx={px} cy={py} r={t * 0.42} color="#FFFFFF" opacity={0.85} />;
        })}
      </Group>
    ),
    face: { cx, cy: cy + r - t / 2, size: t * 1.4 },
  };
};

const bucket: Drawer = ({ w, h, base }) => ({
  body: (
    <Group>
      <Path
        path={`M ${w * 0.26} ${h * 0.36} q ${w * 0.24} ${-h * 0.4} ${w * 0.48} 0`}
        style="stroke"
        strokeWidth={2.5}
        color={INK}
      />
      <Path path={`M ${G + 4} ${h * 0.32} L ${w - G - 4} ${h * 0.32} L ${w - G - 12} ${h - G} L ${G + 12} ${h - G} Z`} color={base} />
    </Group>
  ),
  details: <RoundedRect x={G + 4} y={h * 0.32} width={w - G * 2 - 8} height={h * 0.12} r={3} color={shade(base, -0.16)} />,
  face: { cx: w / 2, cy: h * 0.68, size: h * 0.66 },
});

export const seasonDrawers: Record<string, Drawer> = {
  laptop,
  folder,
  tablet,
  agenda,
  thermos,
  charger,
  businessCards,
  umbrella,
  console: gameConsole,
  magazine,
  coffee,
  labCoat,
  goggles,
  portfolio,
  tshirt,
  sweater,
  dress,
  towel,
  shoes,
  swimsuit,
  sunscreen,
  shampoo,
  toiletry,
  hat,
  boots,
  camera,
  guidebook,
  souvenir,
  swimRing,
  bucket,
};
