// Builds small self-hosted LXGW WenKai TC fonts containing only the characters the game uses,
// so the PWA can precache them for offline play. Re-run (`pnpm fonts`) after adding new Chinese text.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const VERSION = 'v1.522';
const BASE = `https://github.com/lxgw/LxgwWenkaiTC/releases/download/${VERSION}`;
const FACES = [
  { file: 'LXGWWenKaiTC-Regular.ttf', out: 'wenkai-tc-400.woff2' },
  { file: 'LXGWWenKaiTC-Medium.ttf', out: 'wenkai-tc-700.woff2' },
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
for (const { file, out } of FACES) {
  const src = join(CACHE, file);
  if (!existsSync(src)) {
    console.log(`downloading ${file}`);
    const res = await fetch(`${BASE}/${file}`);
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    writeFileSync(src, Buffer.from(await res.arrayBuffer()));
  }
  const woff2 = await subsetFont(readFileSync(src), text, { targetFormat: 'woff2' });
  writeFileSync(join(OUT, out), woff2);
  console.log(`${out}: ${(woff2.length / 1024).toFixed(1)} KB`);
}
if (!existsSync(join(OUT, 'LXGWWenKaiTC-OFL.txt'))) {
  const res = await fetch('https://raw.githubusercontent.com/lxgw/LxgwWenkaiTC/main/OFL.txt');
  if (res.ok) writeFileSync(join(OUT, 'LXGWWenKaiTC-OFL.txt'), await res.text());
}
writeFileSync(join(OUT, 'wenkai-glyphs.txt'), text);
console.log(`${chars.size} characters`);
