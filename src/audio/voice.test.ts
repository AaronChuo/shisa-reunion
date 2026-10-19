import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { voiceKey } from './voice';
import { voiceLines } from './voiceLines';
import recorded from './voices.json';

describe('recorded narration', () => {
  it('has a recording for every line the game reads aloud', () => {
    const have = new Set<string>(recorded);
    const missing = voiceLines()
      .filter((l) => !have.has(voiceKey(l.text, l.as)))
      .map((l) => l.text.slice(0, 16));
    expect(missing, 'run `pnpm voice` to record the new lines').toEqual([]);
  });

  it('ships exactly the recordings it lists', () => {
    const files = readdirSync('public/voice').map((f) => f.replace(/\.mp3$/, ''));
    expect(files.sort()).toEqual([...recorded].sort());
  });

  it('names a recording after what is said and how', () => {
    expect(voiceKey('我是西薩！', 'narrator')).toMatch(/^[0-9a-f]{16}$/);
    expect(voiceKey('我是西薩！', 'shisa')).not.toBe(voiceKey('我是西薩！', 'narrator'));
    expect(voiceKey('西薩團聚了！', 'shisa')).not.toBe(voiceKey('我是西薩！', 'shisa'));
  });

  it('records the reading of a Japanese word, not the kana', () => {
    expect(voiceKey('西薩（シーサー）是獅子', 'narrator')).toBe(voiceKey('西薩是獅子', 'narrator'));
  });
});
