import {
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { KeychainId } from '@/data/keychains';
import type { BagSkin } from '@/data/themes';
import type { BagType, CompartmentKind } from '@/game/types';

import { BagPattern } from './bagSkins';
import { KeychainCharm } from './keychains';

// Pure Skia drawing of the open bag (no React Native imports), so the
// preview script can render every bag type headless.

export interface BagFrame {
  id: string;
  kind: CompartmentKind;
  x: number;
  y: number;
  cols: number;
  rows: number;
  blocked: [number, number][];
}

interface Props {
  type: BagType;
  /** Backpack fabric; the other bag types have their own fixed look. */
  skin: BagSkin;
  keychain?: KeychainId | null;
  bag: { x: number; y: number; w: number; h: number };
  cell: number;
  frames: BagFrame[];
  isDark: boolean;
  gridLine: string;
}

type Tone = { light: string; dark: string };
interface Look {
  body: Tone;
  inside: Tone;
  radius: number; // in cells
}

export const BAG_LOOKS: Record<Exclude<BagType, 'backpack'>, Look> = {
  briefcase: { body: { light: '#C99A74', dark: '#9E7658' }, inside: { light: '#F3E4D2', dark: '#4A3B35' }, radius: 0.3 },
  college: { body: { light: '#A9C4A6', dark: '#76927A' }, inside: { light: '#EEF3E6', dark: '#3A4238' }, radius: 0.45 },
  suitcase: { body: { light: '#A8C8E8', dark: '#7896B4' }, inside: { light: '#EAF3FB', dark: '#353D4A' }, radius: 0.5 },
};

const BRASS = '#E8C06A';
const INK = '#5B4636';

export function darken(hex: string, k = 0.9): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * k);
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

export function BagSkia({ type, skin, keychain, bag, cell, frames, isDark, gridLine }: Props) {
  const look = type === 'backpack' ? { body: skin.body, inside: skin.inside, radius: 0.6 } : BAG_LOOKS[type];
  const body = isDark ? look.body.dark : look.body.light;
  const inside = isDark ? look.inside.dark : look.inside.light;
  const r = cell * look.radius;

  const grid = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (const f of frames) {
      for (let x = 1; x < f.cols; x++) {
        p.moveTo(f.x + x * cell, f.y + 4);
        p.lineTo(f.x + x * cell, f.y + f.rows * cell - 4);
      }
      for (let y = 1; y < f.rows; y++) {
        p.moveTo(f.x + 4, f.y + y * cell);
        p.lineTo(f.x + f.cols * cell - 4, f.y + y * cell);
      }
    }
    return p.detach();
  }, [frames, cell]);

  return (
    <Group>
      <Carry type={type} bag={bag} cell={cell} body={body} />
      {/* shadow + body */}
      <Group transform={[{ translateY: 6 }]} opacity={0.16}>
        <RoundedRect x={bag.x} y={bag.y} width={bag.w} height={bag.h} r={r} color={INK} />
      </Group>
      <RoundedRect x={bag.x} y={bag.y} width={bag.w} height={bag.h} r={r}>
        <LinearGradient start={vec(0, bag.y)} end={vec(0, bag.y + bag.h)} colors={[body, darken(body)]} />
      </RoundedRect>
      {type === 'backpack' ? (
        <BagPattern skin={skin} x={bag.x} y={bag.y} w={bag.w} h={bag.h} r={r} step={cell * 0.9} isDark={isDark} />
      ) : (
        <Trim type={type} bag={bag} cell={cell} body={body} />
      )}
      {frames.map((f) => (
        <Group key={f.id}>
          <PocketPatch f={f} cell={cell} body={body} />
          <RoundedRect
            x={f.x - 3}
            y={f.y - 3}
            width={f.cols * cell + 6}
            height={f.rows * cell + 6}
            r={cell * 0.25}
            color={f.kind === 'pouch' ? (isDark ? '#3E5566' : '#E4F3FB') : inside}
          />
        </Group>
      ))}
      <Path path={grid} style="stroke" strokeWidth={1.5} color={gridLine} strokeCap="round">
        <DashPathEffect intervals={[5, 6]} />
      </Path>
      {frames.flatMap((f) =>
        f.blocked.map(([x, y]) => (
          <RoundedRect
            key={`${f.id}${x},${y}`}
            x={f.x + x * cell + 3}
            y={f.y + y * cell + 3}
            width={cell - 6}
            height={cell - 6}
            r={8}
            color={body}
          />
        )),
      )}
      {keychain ? (
        <KeychainCharm id={keychain} cx={bag.x + bag.w + cell * 0.1} cy={bag.y + cell * 1.3} size={cell * 0.62} />
      ) : null}
    </Group>
  );
}

type Part = { type: BagType; bag: Props['bag']; cell: number; body: string };

/** What you carry it by: loop handle, short leather handle, long strap, telescopic handle. */
function Carry({ type, bag, cell, body }: Part) {
  const cx = bag.x + bag.w / 2;
  const top = bag.y + 8;
  const rise = cell * 0.62;
  if (type === 'suitcase') {
    const hw = Math.min(bag.w * 0.28, cell * 2);
    const rod = cell * 0.1;
    return (
      <Group>
        <RoundedRect x={cx - hw / 2} y={top - rise} width={rod} height={rise + 4} r={rod / 2} color="#9AA3AE" />
        <RoundedRect x={cx + hw / 2 - rod} y={top - rise} width={rod} height={rise + 4} r={rod / 2} color="#9AA3AE" />
        <RoundedRect x={cx - hw / 2 - 4} y={top - rise - cell * 0.1} width={hw + 8} height={cell * 0.2} r={cell * 0.1} color={INK} />
      </Group>
    );
  }
  if (type === 'college') {
    // a long shoulder strap looping high over the bag
    return (
      <Path
        path={`M ${bag.x + cell * 0.5} ${top} C ${bag.x + cell * 0.2} ${top - rise * 1.3} ${bag.x + bag.w - cell * 0.2} ${top - rise * 1.3} ${bag.x + bag.w - cell * 0.5} ${top}`}
        style="stroke"
        strokeWidth={cell * 0.22}
        strokeCap="round"
        color={darken(body, 0.82)}
      />
    );
  }
  const hw = type === 'briefcase' ? Math.min(bag.w * 0.22, cell * 1.6) : Math.min(bag.w * 0.34, cell * 2.4);
  const hh = type === 'briefcase' ? rise * 0.75 : rise;
  return (
    <Path
      path={`M ${cx - hw / 2} ${top} q 0 ${-hh} ${hw / 2} ${-hh} q ${hw / 2} 0 ${hw / 2} ${hh}`}
      style="stroke"
      strokeWidth={cell * (type === 'briefcase' ? 0.24 : 0.2)}
      strokeCap="round"
      color={darken(body, type === 'briefcase' ? 0.75 : 0.9)}
    />
  );
}

/** Per-type decoration on the body: clasps, canvas stitching, shell ribs and wheels. */
function Trim({ type, bag, cell, body }: Part) {
  const dark = darken(body, 0.82);
  if (type === 'briefcase') {
    const cw = cell * 0.5;
    const ch = cell * 0.3;
    return (
      <Group>
        {[0.26, 0.74].map((t) => (
          <Group key={t}>
            <RoundedRect x={bag.x + bag.w * t - cw / 2} y={bag.y + bag.h - ch * 0.6} width={cw} height={ch} r={4} color={BRASS} />
            <Circle cx={bag.x + bag.w * t} cy={bag.y + bag.h - ch * 0.1} r={cell * 0.05} color={darken(BRASS, 0.7)} />
          </Group>
        ))}
        <RoundedRect x={bag.x + 6} y={bag.y + 6} width={bag.w - 12} height={bag.h - 12} r={cell * 0.24} style="stroke" strokeWidth={1.5} color="rgba(255,255,255,0.35)">
          <DashPathEffect intervals={[6, 5]} />
        </RoundedRect>
      </Group>
    );
  }
  if (type === 'college') {
    return (
      <Group>
        <RoundedRect x={bag.x + 7} y={bag.y + 7} width={bag.w - 14} height={bag.h - 14} r={cell * 0.36} style="stroke" strokeWidth={2} color="rgba(255,255,255,0.45)">
          <DashPathEffect intervals={[7, 5]} />
        </RoundedRect>
        {/* buckle tabs at the bottom */}
        {[0.3, 0.7].map((t) => (
          <RoundedRect key={t} x={bag.x + bag.w * t - cell * 0.12} y={bag.y + bag.h - cell * 0.22} width={cell * 0.24} height={cell * 0.34} r={4} color={dark} />
        ))}
      </Group>
    );
  }
  // suitcase: vertical shell ribs and wheels
  const ribs = Math.max(2, Math.round(bag.w / (cell * 1.4)));
  const wr = cell * 0.17;
  return (
    <Group>
      {Array.from({ length: ribs }, (_, i) => (
        <RoundedRect
          key={i}
          x={bag.x + ((i + 1) * bag.w) / (ribs + 1) - 2}
          y={bag.y + cell * 0.2}
          width={4}
          height={bag.h - cell * 0.4}
          r={2}
          color="rgba(255,255,255,0.28)"
        />
      ))}
      {[bag.x + cell * 0.45, bag.x + bag.w - cell * 0.45].map((x) => (
        <Group key={x}>
          <Circle cx={x} cy={bag.y + bag.h + wr * 0.4} r={wr} color={INK} />
          <Circle cx={x} cy={bag.y + bag.h + wr * 0.4} r={wr * 0.4} color="#D8CFC4" />
        </Group>
      ))}
    </Group>
  );
}

/** The fabric around a pocket: sewn-on patch, padded quilted sleeve, or clear zip pouch. */
function PocketPatch({ f, cell, body }: { f: BagFrame; cell: number; body: string }) {
  if (f.kind === 'main') return null;
  const pad = cell * 0.22;
  const x = f.x - pad;
  const y = f.y - pad;
  const w = f.cols * cell + pad * 2;
  const h = f.rows * cell + pad * 2;
  if (f.kind === 'sleeve') {
    const quilt = Skia.PathBuilder.Make();
    const s = cell * 0.5;
    for (let d = -h; d < w; d += s) {
      quilt.moveTo(x + d, y);
      quilt.lineTo(x + d + h, y + h);
      quilt.moveTo(x + d + h, y);
      quilt.lineTo(x + d, y + h);
    }
    const clip = Skia.RRectXY(Skia.XYWHRect(x, y, w, h), cell * 0.34, cell * 0.34);
    return (
      <Group>
        <RoundedRect x={x} y={y} width={w} height={h} r={cell * 0.34} color="#8D93A8" />
        <Group clip={clip}>
          <Path path={quilt.detach()} style="stroke" strokeWidth={1.5} color="rgba(255,255,255,0.3)" />
        </Group>
      </Group>
    );
  }
  if (f.kind === 'pouch') {
    return (
      <Group>
        <RoundedRect x={x} y={y} width={w} height={h} r={cell * 0.3} color="rgba(168,216,240,0.9)" />
        <RoundedRect x={x + 6} y={y + 3} width={w - 12} height={3} r={1.5} color="#FFFFFF" />
        <RoundedRect x={x + 5} y={y + h * 0.3} width={3} height={h * 0.4} r={1.5} color="rgba(255,255,255,0.8)" />
      </Group>
    );
  }
  return (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={cell * 0.3} color={darken(body)} />
      <RoundedRect x={x + 4} y={y + 4} width={w - 8} height={h - 8} r={cell * 0.26} style="stroke" strokeWidth={1.5} color="rgba(255,255,255,0.6)">
        <DashPathEffect intervals={[4, 4]} />
      </RoundedRect>
    </Group>
  );
}
