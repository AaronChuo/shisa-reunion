// Builds the postcard photos: takes each original (a family photo dropped into .cache/photos/<place>.jpg, or else the
// Wikimedia Commons file recorded in src/content/photos.json), crops it to the postcard's 5:3, shrinks it and saves
// WebP for offline play. Re-encoding drops all metadata, including where and when a photo was taken.
// Originals stay in .cache, which never goes into the repo: downloads under .cache/photos/commons/, named after their
// Commons file so that switching a place to another photo fetches the new one. Re-run with `pnpm photos`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const UA = 'shisa-reunion/1.0 (personal family game; build script)';
const CACHE = '.cache/photos';
const COMMONS = join(CACHE, 'commons');
const OUT = 'public/places';
const W = 1000;
const H = 600;

const photos = JSON.parse(readFileSync('src/content/photos.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A 1600 px rendition from Commons (kinder to their servers than the original), retrying politely if rate-limited */
async function download(p) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [k, v] of Object.entries({ action: 'query', format: 'json', titles: `File:${p.title}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '1600' })) {
    api.searchParams.set(k, v);
  }
  const info = await (await fetch(api, { headers: { 'User-Agent': UA } })).json();
  const url = Object.values(info.query.pages)[0]?.imageinfo?.[0]?.thumburl ?? p.download;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status !== 429) throw new Error(`${p.title}: ${res.status}`);
    await sleep(4000 * (attempt + 1));
  }
  throw new Error(`${p.title}: still rate-limited`);
}
mkdirSync(COMMONS, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const p of photos) {
  // A photo of our own wins over the downloaded one
  const own = ['jpg', 'jpeg', 'png', 'webp'].map((e) => join(CACHE, `${p.place}.${e}`)).find((f) => existsSync(f));
  const src = own ?? (p.download ? join(COMMONS, p.title.replace(/[^\w.-]+/g, '_')) : null);
  if (!src) throw new Error(`${p.place}: put the photo at ${join(CACHE, `${p.place}.jpg`)}`);
  if (!existsSync(src)) {
    console.log(`downloading ${p.title}`);
    writeFileSync(src, await download(p));
  }
  await sleep(1500);
  const out = join(OUT, `${p.place}.webp`);
  const info = await sharp(src)
    .rotate()
    .resize(W, H, { fit: 'cover', position: p.position ?? 'centre' })
    .webp({ quality: 74 })
    .toFile(out);
  console.log(`${out}: ${(info.size / 1024).toFixed(0)} KB`);
}
