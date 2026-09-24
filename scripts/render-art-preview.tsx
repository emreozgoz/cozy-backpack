/**
 * npm run art
 *
 * Renders every catalog item (light + dark, plus the face expressions) to
 * design/previews/items.png with Skia's headless renderer, so the art can be
 * reviewed without a device.
 */
import fs from 'node:fs';
import path from 'node:path';

import { loadSkia } from './skia-node';

async function main() {
  const { drawOffscreen, makeOffscreenSurface, Group, Rect, RoundedRect } = await loadSkia();
  // Art modules are required (not imported) so they load after Skia is ready.
  const { ItemSkia, itemSize } = require('../src/art/ItemSkia') as typeof import('../src/art/ItemSkia');
  const items: Record<string, object> = require('../assets/data/items.json');
  type ItemDef = import('../src/game/types').ItemDef;
  type Expression = import('../src/art/primitives/Face').Expression;

  const CELL = 56;
  const PAD = 28;
  const GAP = 22;
  const WIDTH = 1200;
  const defs: ItemDef[] = Object.entries(items).map(([id, d]) => ({ id, ...d }) as ItemDef);

  // Flow layout of all items, reused for the light and the dark panel.
  const place = (list: { def: ItemDef; expression: Expression }[]) => {
    let x = PAD;
    let y = PAD;
    let rowH = 0;
    const out: { def: ItemDef; expression: Expression; x: number; y: number }[] = [];
    for (const e of list) {
      const { w, h } = itemSize(e.def, 0, CELL);
      if (x + w > WIDTH - PAD) {
        x = PAD;
        y += rowH + GAP;
        rowH = 0;
      }
      out.push({ ...e, x, y });
      x += w + GAP;
      rowH = Math.max(rowH, h);
    }
    return { out, height: y + rowH + PAD };
  };

  const all = place(defs.map((def) => ({ def, expression: 'idle' as Expression })));
  const faces = place(
    ['book_math', 'lunchbox', 'plush'].flatMap((id) =>
      (['idle', 'held', 'happy', 'worried'] as Expression[]).map((expression) => ({
        def: defs.find((d) => d.id === id)!,
        expression,
      })),
    ),
  );

  const panels = [
    { isDark: false, bg: '#FFF6EC', layout: all },
    { isDark: true, bg: '#241E2B', layout: all },
    { isDark: false, bg: '#FDEFE0', layout: faces },
  ];
  const height = panels.reduce((n, p) => n + p.layout.height, 0);
  const surface = makeOffscreenSurface(WIDTH, height);

  let top = 0;
  const scene = (
    <Group>
      {panels.map((p, pi) => {
        const y0 = top;
        top += p.layout.height;
        return (
          <Group key={pi} transform={[{ translateY: y0 }]}>
            <Rect x={0} y={0} width={WIDTH} height={p.layout.height} color={p.bg} />
            {p.layout.out.map((e, i) => (
              <Group key={i} transform={[{ translateX: e.x }, { translateY: e.y }]}>
                <RoundedRect
                  x={-4}
                  y={-4}
                  width={itemSize(e.def, 0, CELL).w + 8}
                  height={itemSize(e.def, 0, CELL).h + 8}
                  r={8}
                  color={p.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(91,70,54,0.04)'}
                />
                <ItemSkia
                  def={e.def}
                  shapeIndex={0}
                  cell={CELL}
                  isDark={p.isDark}
                  expression={e.expression}
                />
              </Group>
            ))}
          </Group>
        );
      })}
    </Group>
  );

  const image = await drawOffscreen(surface, scene);
  const out = path.resolve(__dirname, '../design/previews/items.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, image.encodeToBytes());
  console.log(`✔ wrote ${path.relative(process.cwd(), out)} (${defs.length} items)`);

  // ---- room ------------------------------------------------------------
  const { RoomScene } = require('../src/art/room/RoomScene') as typeof import('../src/art/room/RoomScene');
  const { DEFAULT_ROOM } = require('../src/data/decor') as typeof import('../src/data/decor');
  const fancy = {
    wall: 'wall_cat',
    curtain: 'curtain_butter',
    lamp: 'lamp_mushroom',
    plant: 'plant_monstera',
    rug: 'rug_rainbow',
  } as const;
  const RW = 390;
  const RH = 720;
  const { BAG_SKINS, THEMES } = require('../src/data/themes') as typeof import('../src/data/themes');
  const themed = (id: string) => {
    const t = THEMES.find((x) => x.id === id)!;
    const room = { ...DEFAULT_ROOM } as Record<string, string>;
    for (const d of t.decor) room[d.split('_')[0]] = d;
    return { room: room as typeof DEFAULT_ROOM, skin: BAG_SKINS.find((s) => s.id === t.bagSkin) };
  };
  const rooms = [
    { ...themed('autumn'), isDark: false, daylight: 'evening' as const },
    { ...themed('sweets'), isDark: false, daylight: 'day' as const },
    { ...themed('starry'), isDark: true, daylight: 'night' as const },
    { ...themed('garden'), isDark: false, daylight: 'morning' as const },

    { room: DEFAULT_ROOM, isDark: false, daylight: 'morning' as const },
    {
      room: { ...DEFAULT_ROOM, plant: 'plant_cactus', wall: 'wall_rainbow', curtain: 'curtain_lavender' },
      isDark: false,
      daylight: 'evening' as const,
    },
    { room: fancy, isDark: true, daylight: 'night' as const },
    { room: { ...fancy, lamp: 'lamp_moon', rug: 'rug_cloud' }, isDark: false, daylight: 'day' as const },
  ];
  const roomSurface = makeOffscreenSurface(RW * rooms.length + 10 * (rooms.length - 1), RH);
  const roomImage = await drawOffscreen(
    roomSurface,
    <Group>
      {rooms.map((r, i) => (
        <Group key={i} transform={[{ translateX: i * (RW + 10) }]}>
          <RoomScene w={RW} h={RH} room={r.room} isDark={r.isDark} daylight={r.daylight} skin={'skin' in r ? r.skin : undefined} />
        </Group>
      ))}
    </Group>,
  );
  // ---- keychains -----------------------------------------------------------
  const { KeychainCharm } = require('../src/art/keychains') as typeof import('../src/art/keychains');
  const { KEYCHAINS } = require('../src/data/keychains') as typeof import('../src/data/keychains');
  const kcSurface = makeOffscreenSurface(KEYCHAINS.length * 110 + 20, 260);
  const kcImage = await drawOffscreen(
    kcSurface,
    <Group>
      <Rect x={0} y={0} width={KEYCHAINS.length * 110 + 20} height={260} color="#FDEFE0" />
      {KEYCHAINS.map((k, i) => (
        <Group key={k.id}>
          <KeychainCharm id={k.id} cx={65 + i * 110} cy={80} size={70} />
          <KeychainCharm id={k.id} cx={65 + i * 110} cy={200} size={70} locked withChain={false} />
        </Group>
      ))}
    </Group>,
  );
  fs.writeFileSync(path.resolve(__dirname, '../design/previews/keychains.png'), kcImage.encodeToBytes());
  console.log('✔ wrote design/previews/keychains.png');

  // ---- cat ----------------------------------------------------------------
  const { CatSkia } = require('../src/art/CatSkia') as typeof import('../src/art/CatSkia');
  const catSurface = makeOffscreenSurface(360, 180);
  const catImage = await drawOffscreen(
    catSurface,
    <Group>
      <Rect x={0} y={0} width={180} height={180} color="#E9CDAE" />
      <Rect x={180} y={0} width={180} height={180} color="#5A4638" />
      <Group transform={[{ translateX: 20 }, { translateY: 20 }]}>
        <CatSkia size={140} happy={false} />
      </Group>
      <Group transform={[{ translateX: 200 }, { translateY: 20 }]}>
        <CatSkia size={140} happy />
      </Group>
    </Group>,
  );
  fs.writeFileSync(path.resolve(__dirname, '../design/previews/cat.png'), catImage.encodeToBytes());
  console.log('✔ wrote design/previews/cat.png');

  const roomOut = path.resolve(__dirname, '../design/previews/room.png');
  fs.writeFileSync(roomOut, roomImage.encodeToBytes());
  console.log(`✔ wrote ${path.relative(process.cwd(), roomOut)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
