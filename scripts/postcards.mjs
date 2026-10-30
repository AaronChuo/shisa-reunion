// Builds the postcard illustrations: takes each zone's three pictures (.cache/postcards/<zone>/{1,2,3}.png, as the
// artist delivered them, renamed to the zone's id and the card's number), crops them to exactly 5:3 and saves WebP for
// offline play: a large one for the postcard and a small one for the collection grid.
// Originals stay in .cache, which never goes into the repo. Re-run with `pnpm postcards`.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const CACHE = '.cache/postcards';
const OUT = 'public/postcards';
const SIZES = [
  { suffix: '', w: 960, h: 576 },
  { suffix: '-small', w: 320, h: 192 },
];

for (const zone of readdirSync(CACHE).filter((d) => !d.startsWith('.'))) {
  mkdirSync(join(OUT, zone), { recursive: true });
  for (const n of [1, 2, 3]) {
    const src = join(CACHE, zone, `${n}.png`);
    if (!existsSync(src)) throw new Error(`${zone}: put postcard ${n} at ${src}`);
    for (const { suffix, w, h } of SIZES) {
      const out = join(OUT, zone, `${n}${suffix}.webp`);
      const info = await sharp(src).resize(w, h, { fit: 'cover' }).webp({ quality: 70 }).toFile(out);
      console.log(`${out}: ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}
