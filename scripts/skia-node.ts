/**
 * Headless Skia for Node scripts: loads CanvasKit and routes the app's
 * '@shopify/react-native-skia' imports to the headless build, so art
 * components from src/art render to PNG without a device.
 */
import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import zlib from 'node:zlib';

type Resolve = (request: string, ...rest: unknown[]) => string;

let loaded = false;

export async function loadSkia() {
  if (!loaded) {
    const mod = Module as unknown as { _resolveFilename: Resolve };
    const resolve = mod._resolveFilename;
    mod._resolveFilename = function (request, ...rest) {
      const target =
        request === '@shopify/react-native-skia' ? path.join(__dirname, 'skia-headless-shim.cjs') : request;
      return resolve.call(this, target, ...rest);
    };
    const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit');
    (globalThis as { CanvasKit?: unknown }).CanvasKit = await CanvasKitInit();
    loaded = true;
  }
  return require('@shopify/react-native-skia');
}

/**
 * Writes RGBA pixels as a PNG *without* an alpha channel (colour type 2).
 * The App Store rejects a marketing icon that has an alpha channel at all.
 */
export function writeOpaquePng(file: string, width: number, height: number, rgba: Uint8Array) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const o = y * (width * 3 + 1) + 1 + x * 3;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}
