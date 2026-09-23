/**
 * npm run icons
 *
 * Renders the app icon (iOS light/dark/tinted), splash mark and Android
 * adaptive layers from src/art/AppIcon.tsx into assets/icons/, plus a
 * review sheet at design/previews/icons.png.
 */
import fs from 'node:fs';
import path from 'node:path';

import { loadSkia, writeOpaquePng } from './skia-node';

async function main() {
  const skia = await loadSkia();
  const { drawOffscreen, makeOffscreenSurface, Group, Rect, RoundedRect } = skia;
  const { AppIcon } = require('../src/art/AppIcon') as typeof import('../src/art/AppIcon');
  type Variant = import('../src/art/AppIcon').IconVariant;

  const outDir = path.resolve(__dirname, '../assets/icons');
  fs.mkdirSync(outDir, { recursive: true });

  const render = async (size: number, variant: Variant, scale?: number) => {
    const surface = makeOffscreenSurface(size, size);
    return drawOffscreen(surface, <AppIcon size={size} variant={variant} scale={scale} />);
  };

  const save = (name: string, bytes: Uint8Array) => {
    fs.writeFileSync(path.join(outDir, name), bytes);
    console.log(`  assets/icons/${name}`);
  };

  // iOS marketing icon: opaque, no alpha channel.
  const light = await render(1024, 'light');
  writeOpaquePng(path.join(outDir, 'icon.png'), 1024, 1024, light.readPixels() as Uint8Array);
  console.log('  assets/icons/icon.png (opaque)');

  save('icon-dark.png', (await render(1024, 'dark')).encodeToBytes());
  save('icon-tinted.png', (await render(1024, 'tinted')).encodeToBytes());
  save('splash-icon.png', (await render(1024, 'mark', 0.92)).encodeToBytes());
  // Android adaptive layers keep the bag inside the 66% safe zone.
  save('android-foreground.png', (await render(1024, 'mark', 0.5)).encodeToBytes());
  save('android-monochrome.png', (await render(1024, 'mono', 0.5)).encodeToBytes());
  save('favicon.png', (await render(64, 'light')).encodeToBytes());

  // Review sheet: iOS-style rounded masks at home-screen sizes, light and dark.
  const W = 900;
  const H = 360;
  const sheet = makeOffscreenSurface(W, H);
  const tiles: { x: number; y: number; size: number; variant: Variant; bg: string }[] = [
    { x: 30, y: 30, size: 180, variant: 'light', bg: '#FFFFFF' },
    { x: 240, y: 60, size: 120, variant: 'light', bg: '#FFFFFF' },
    { x: 390, y: 90, size: 60, variant: 'light', bg: '#FFFFFF' },
    { x: 480, y: 30, size: 180, variant: 'dark', bg: '#1C1A22' },
    { x: 690, y: 30, size: 180, variant: 'tinted', bg: '#2A3A55' },
  ];
  const image = await drawOffscreen(
    sheet,
    <Group>
      <Rect x={0} y={0} width={W} height={H} color="#EDE7E1" />
      <Rect x={460} y={0} width={W - 460} height={H} color="#16141B" />
      {tiles.map((t, i) => (
        <Group key={i} transform={[{ translateX: t.x }, { translateY: t.y }]}>
          <Group
            clip={{
              rect: { x: 0, y: 0, width: t.size, height: t.size },
              rx: t.size * 0.225,
              ry: t.size * 0.225,
            }}
          >
            <RoundedRect x={0} y={0} width={t.size} height={t.size} r={t.size * 0.225} color={t.bg} />
            <AppIcon size={t.size} variant={t.variant} />
          </Group>
        </Group>
      ))}
      {/* splash mark on the splash background colours */}
      <Rect x={30} y={240} width={400} height={100} color="#FFF6EC" />
      <Group transform={[{ translateX: 30 + 150 }, { translateY: 240 }]}>
        <AppIcon size={100} variant="mark" scale={0.92} />
      </Group>
      <Rect x={480} y={240} width={390} height={100} color="#241E2B" />
      <Group transform={[{ translateX: 480 + 145 }, { translateY: 240 }]}>
        <AppIcon size={100} variant="mark" scale={0.92} />
      </Group>
    </Group>,
  );
  const sheetFile = path.resolve(__dirname, '../design/previews/icons.png');
  fs.writeFileSync(sheetFile, image.encodeToBytes());
  console.log('  design/previews/icons.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
