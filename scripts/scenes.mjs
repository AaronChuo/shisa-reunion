// Builds the stage backgrounds: takes each zone's three paintings (.cache/scenes/<zone>/{day,dusk,night}.png, as the
// artist delivered them, renamed to the zone's id), evens out their size, and saves WebP for offline play.
// Originals stay in .cache, which never goes into the repo. Re-run with `pnpm scenes`.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const CACHE = '.cache/scenes';
const OUT = 'public/scenes';
const W = 1600;
const H = 1000;
const TIMES = ['day', 'dusk', 'night'];

for (const zone of readdirSync(CACHE).filter((d) => !d.startsWith('.'))) {
  mkdirSync(join(OUT, zone), { recursive: true });
  for (const t of TIMES) {
    const src = join(CACHE, zone, `${t}.png`);
    if (!existsSync(src)) throw new Error(`${zone}: put the ${t} painting at ${src}`);
    const out = join(OUT, zone, `${t}.webp`);
    // The paintings come a pixel or two off 1600×1000; stretching that little doesn't show
    const info = await sharp(src).resize(W, H, { fit: 'fill' }).webp({ quality: 78 }).toFile(out);
    console.log(`${out}: ${(info.size / 1024).toFixed(0)} KB`);
  }
}
