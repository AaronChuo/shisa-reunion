import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The self-hosted Chinese font only contains characters that existed when `pnpm fonts` last ran
function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

describe('self-hosted font subset', () => {
  it('covers every non-ASCII character used in the game', () => {
    const glyphs = new Set(readFileSync('public/fonts/font-glyphs.txt', 'utf8'));
    const missing = new Set<string>();
    for (const f of [...sources('src'), 'index.html']) {
      for (const ch of readFileSync(f, 'utf8')) if ((ch.codePointAt(0) ?? 0) > 0x7f && !glyphs.has(ch)) missing.add(ch);
    }
    expect([...missing].join(''), 'run `pnpm fonts` to rebuild the subset').toBe('');
  });
});
