// Builds small self-hosted GenSen Rounded TW fonts (源泉圓體, Taiwan glyph forms) containing only the characters the
// game uses, so the PWA can precache them for offline play. Re-run (`pnpm fonts`) after adding new Chinese text.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const VERSION = 'v2.100';
const ZIP = 'GenSenRounded2TW-otf.zip';
const URL = `https://github.com/ButTaiwan/gensen-font/releases/download/${VERSION}/${ZIP}`;
const LICENSE = 'https://raw.githubusercontent.com/ButTaiwan/gensen-font/master/SIL_Open_Font_License_1.1.txt';
const FACES = [
  { file: 'GenSenRounded2TW-R.otf', out: 'gensen-tw-400.woff2' },
  { file: 'GenSenRounded2TW-B.otf', out: 'gensen-tw-700.woff2' },
];
const CACHE = '.cache/fonts';
const OUT = 'public/fonts';

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|html|css)$/.test(name) && !/\.test\.ts$/.test(name)) files.push(p);
  }
  return files;
}

const chars = new Set();
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
for (const f of [...walk('src'), 'index.html']) {
  for (const ch of readFileSync(f, 'utf8')) if (ch.codePointAt(0) > 0x7f) chars.add(ch);
}
const text = [...chars].sort().join('');

mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });
const zip = join(CACHE, ZIP);
if (!existsSync(zip)) {
  console.log(`downloading ${ZIP}`);
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
}
for (const { file, out } of FACES) {
  const src = join(CACHE, 'gensen', file);
  if (!existsSync(src)) execFileSync('unzip', ['-o', '-q', '-j', zip, `*${file}`, '-d', join(CACHE, 'gensen')]);
  const woff2 = await subsetFont(readFileSync(src), text, { targetFormat: 'woff2' });
  writeFileSync(join(OUT, out), woff2);
  console.log(`${out}: ${(woff2.length / 1024).toFixed(1)} KB`);
}
if (!existsSync(join(OUT, 'GenSenRounded-OFL.txt'))) {
  const res = await fetch(LICENSE);
  if (res.ok) writeFileSync(join(OUT, 'GenSenRounded-OFL.txt'), await res.text());
}
writeFileSync(join(OUT, 'font-glyphs.txt'), text);
console.log(`${chars.size} characters`);
