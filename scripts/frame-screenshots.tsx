/**
 * npm run screenshots
 *
 * Frames raw simulator screenshots for the App Store:
 *   design/screenshots/raw/{iphone|ipad}/{tr|en}/{1..6}.png
 * → design/screenshots/out/{iphone|ipad}/{tr|en}/{1..6}.png
 *
 * Each image gets a pastel background, the caption from store/listing.json
 * (Nunito Black) and the screenshot inside a soft device frame, at the exact sizes
 * App Store Connect asks for. With no raw screenshots yet, `--demo` renders a
 * sample set from the room art so the layout can be checked.
 */
import fs from 'node:fs';
import path from 'node:path';

import { loadSkia, writeOpaquePng } from './skia-node';

const root = path.resolve(__dirname, '..');
const DEVICES = {
  // 6.9" iPhone (required) and 13" iPad (required when the app supports iPad)
  iphone: { w: 1320, h: 2868, screenRadius: 110, bezel: 34 },
  ipad: { w: 2064, h: 2752, screenRadius: 60, bezel: 40 },
} as const;
type Device = keyof typeof DEVICES;
const LANGS = ['tr', 'en'] as const;
const BACKGROUNDS: [string, string][] = [
  ['#CFEAF7', '#EFF9FE'],
  ['#FBD9CC', '#FFF3EC'],
  ['#D3EEDC', '#F1FAF4'],
  ['#E3D6F7', '#F6F1FD'],
  ['#FFEBB8', '#FFF8E6'],
  ['#F9D3DE', '#FDF0F4'],
];

async function main() {
  const demo = process.argv.includes('--demo');
  const skia = await loadSkia();
  const {
    Skia,
    drawOffscreen,
    makeOffscreenSurface,
    Group,
    Rect,
    RoundedRect,
    LinearGradient,
    Paragraph,
    Image,
    vec,
    Circle,
    Path,
  } = skia;
  const listing = JSON.parse(fs.readFileSync(path.join(root, 'store/listing.json'), 'utf8'));

  // Captions use Nunito Black: rounded, and it has every Turkish letter
  // (Fredoka, the first choice, lacks ş, ğ and İ).
  const provider = Skia.TypefaceFontProvider.Make();
  const nunito = Skia.Typeface.MakeFreeTypeFaceFromData(
    Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(path.join(root, 'assets/fonts/Nunito.ttf')))),
  );
  provider.registerFont(nunito, 'Nunito');

  // Fail loudly if a caption uses a letter the font doesn't have — otherwise
  // it silently turns into a box or a misplaced accent.
  const probe = Skia.Font(nunito, 20);
  for (const lang of LANGS) {
    for (const text of listing[lang].screenshots as string[]) {
      const missingGlyphs = [...text].filter((ch) => ch.trim() && probe.getGlyphIDs(ch)[0] === 0);
      if (missingGlyphs.length)
        throw new Error(`Caption "${text}" uses letters Nunito lacks: ${missingGlyphs.join(' ')}`);
    }
  }

  const caption = (text: string, width: number, size: number) => {
    const p = Skia.ParagraphBuilder.Make({ textAlign: 2 /* center */ }, provider)
      .pushStyle({
        color: Skia.Color('#5B4636'),
        fontFamilies: ['Nunito'],
        fontSize: size,
        fontVariations: [{ axis: 'wght', value: 900 }],
        heightMultiplier: 1.08,
      })
      .addText(text)
      .build();
    p.layout(width);
    return p;
  };

  // Demo mode: the room art stands in for a raw screenshot.
  let demoShot: (
    w: number,
    h: number,
  ) => Promise<ReturnType<typeof Skia.Image.MakeImageFromEncoded>> = async () => null;
  if (demo) {
    const { RoomScene } = require('../src/art/room/RoomScene') as typeof import('../src/art/room/RoomScene');
    const { DEFAULT_ROOM } = require('../src/data/decor') as typeof import('../src/data/decor');
    demoShot = async (w, h) => {
      const s = makeOffscreenSurface(w, h);
      return drawOffscreen(
        s,
        <RoomScene
          w={w}
          h={h}
          room={{ ...DEFAULT_ROOM, plant: 'plant_cactus' }}
          isDark={false}
          daylight="morning"
        />,
      );
    };
  }

  const outRoot = path.join(root, 'design/screenshots', demo ? 'demo' : 'out');
  let written = 0;
  let missing = 0;

  for (const device of Object.keys(DEVICES) as Device[]) {
    const D = DEVICES[device];
    // Screenshot area: centered, below the caption.
    const phoneW = Math.round(D.w * (device === 'iphone' ? 0.8 : 0.78));
    const screenW = phoneW - D.bezel * 2;
    const screenH = Math.round(screenW * (device === 'iphone' ? 2868 / 1320 : 2752 / 2064));
    const phoneH = screenH + D.bezel * 2;
    const phoneX = (D.w - phoneW) / 2;
    // Just below the caption; the device runs off the bottom edge.
    const phoneY = Math.round(D.h * (device === 'iphone' ? 0.2 : 0.22));
    const captionSize = Math.round(D.w * 0.075);

    for (const lang of LANGS) {
      const captions: string[] = listing[lang].screenshots;
      for (let i = 0; i < captions.length; i++) {
        const rawFile = path.join(root, 'design/screenshots/raw', device, lang, `${i + 1}.png`);
        let shot = null;
        if (demo) shot = await demoShot(screenW, screenH);
        else if (fs.existsSync(rawFile)) {
          shot = Skia.Image.MakeImageFromEncoded(
            Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(rawFile))),
          );
        }
        if (!shot) {
          missing++;
          continue;
        }
        const [top, bottom] = BACKGROUNDS[i % BACKGROUNDS.length];
        const para = caption(captions[i], D.w * 0.84, captionSize);
        const surface = makeOffscreenSurface(D.w, D.h);
        const img = await drawOffscreen(
          surface,
          <Group>
            <Rect x={0} y={0} width={D.w} height={D.h}>
              <LinearGradient start={vec(0, 0)} end={vec(0, D.h)} colors={[bottom, top]} />
            </Rect>
            {/* a few soft sparkles */}
            {[
              [0.06, 0.03, 0.02, '#FFE29A'],
              [0.9, 0.05, 0.016, '#FFFFFF'],
              [0.86, 0.2, 0.012, '#FFE29A'],
              [0.12, 0.22, 0.01, '#FFFFFF'],
            ].map(([x, y, r, c], k) => {
              const cx = (x as number) * D.w;
              const cy = (y as number) * D.h;
              const R = (r as number) * D.w;
              const q = R * 0.28;
              return (
                <Path
                  key={k}
                  path={`M ${cx} ${cy - R} Q ${cx + q} ${cy - q} ${cx + R} ${cy} Q ${cx + q} ${cy + q} ${cx} ${cy + R} Q ${cx - q} ${cy + q} ${cx - R} ${cy} Q ${cx - q} ${cy - q} ${cx} ${cy - R} Z`}
                  color={c as string}
                />
              );
            })}
            <Circle
              cx={D.w * 0.5}
              cy={phoneY + phoneH * 0.35}
              r={D.w * 0.55}
              color="#FFFFFF"
              opacity={0.25}
            />
            <Paragraph paragraph={para} x={D.w * 0.08} y={D.h * 0.055} width={D.w * 0.84} />
            {/* device */}
            <Group transform={[{ translateY: 24 }]} opacity={0.18}>
              <RoundedRect
                x={phoneX}
                y={phoneY}
                width={phoneW}
                height={phoneH}
                r={D.screenRadius + D.bezel}
                color="#5B4636"
              />
            </Group>
            <RoundedRect
              x={phoneX}
              y={phoneY}
              width={phoneW}
              height={phoneH}
              r={D.screenRadius + D.bezel}
              color="#2A2230"
            />
            <Group
              clip={{
                rect: { x: phoneX + D.bezel, y: phoneY + D.bezel, width: screenW, height: screenH },
                rx: D.screenRadius,
                ry: D.screenRadius,
              }}
            >
              <Image
                image={shot}
                x={phoneX + D.bezel}
                y={phoneY + D.bezel}
                width={screenW}
                height={screenH}
                fit="cover"
              />
            </Group>
          </Group>,
        );
        const out = path.join(outRoot, device, lang, `${i + 1}.png`);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        // App Store screenshots must not have an alpha channel.
        writeOpaquePng(out, D.w, D.h, img.readPixels() as Uint8Array);
        written++;
      }
    }
  }
  console.log(`✔ ${written} screenshots → ${path.relative(root, outRoot)}`);
  if (missing) {
    console.log(
      `  ${missing} raw screenshots not found. Put them in design/screenshots/raw/{iphone|ipad}/{tr|en}/1..6.png` +
        ` (iPhone 6.9" sim: 1320×2868, iPad 13" sim: 2064×2752), or run with --demo.`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
