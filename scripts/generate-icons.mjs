// Renders the app icon (the Kaaba on green, matching the web app's lib/appIcon.tsx)
// into the PNGs Expo needs. Run with: node scripts/generate-icons.mjs
import { Buffer } from "node:buffer";
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const GREEN = [0x0b, 0x3d, 0x2e, 255];
const GOLD = [0xd4, 0xaf, 0x37, 255];
const BLACK = [0x11, 0x11, 0x11, 255];
const WHITE = [255, 255, 255, 255];
const CLEAR = [0, 0, 0, 0];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Pixel shader for a Kaaba of `scale` (fraction of the canvas) centred on `background`. */
function kaaba(size, scale, { background, body = BLACK, gold = GOLD }) {
  const side = size * scale;
  const left = (size - side) / 2;
  const top = (size - side) / 2;
  const radius = side * 0.06;
  const border = Math.max(1, side * 0.024);
  const bandTop = top + side * 0.22;
  const bandBottom = bandTop + side * 0.14;

  return (x, y) => {
    const dx = Math.max(left + radius - x, 0, x - (left + side - radius));
    const dy = Math.max(top + radius - y, 0, y - (top + side - radius));
    const cornerDistance = Math.hypot(dx, dy);
    if (cornerDistance > radius) return background;
    const edge =
      x < left + border ||
      x > left + side - border ||
      y < top + border ||
      y > top + side - border ||
      cornerDistance > radius - border;
    if (edge || (y >= bandTop && y < bandBottom)) return gold;
    return body;
  };
}

const out = (name, data) => writeFileSync(new URL(`../assets/images/${name}`, import.meta.url), data);

out("icon.png", png(1024, kaaba(1024, 0.5, { background: GREEN })));
// Adaptive icon content must stay inside the central 66% safe zone.
out("android-icon-foreground.png", png(1024, kaaba(1024, 0.42, { background: CLEAR })));
out("android-icon-background.png", png(1024, () => GREEN));
out(
  "android-icon-monochrome.png",
  png(1024, kaaba(1024, 0.42, { background: CLEAR, body: WHITE, gold: CLEAR })),
);
out("splash-icon.png", png(512, kaaba(512, 0.9, { background: CLEAR })));
out("notification-icon.png", png(96, kaaba(96, 0.7, { background: CLEAR, body: WHITE, gold: CLEAR })));
out("favicon.png", png(48, kaaba(48, 0.6, { background: GREEN })));
