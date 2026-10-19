import { describe, expect, it } from 'vitest';
import { STARTERS, VARIANTS } from '../content/shisa';
import { decodeBackup, encodeBackup, summary } from './backup';
import { freshProgress, normalizeProgress } from './store';

// Two shisa beyond the starters, as a played save would have
const extra = VARIANTS.map((v) => v.id)
  .filter((id) => !STARTERS.includes(id))
  .slice(0, 2);
// A consistent save: the zones these clears open are open
const played = () =>
  normalizeProgress({
    ...freshProgress(),
    tokens: 7,
    owned: [...freshProgress().owned, ...extra],
    clears: { ...freshProgress().clears, naha: 2, yomitan: 1 },
    age: 'kid',
    restMin: 30,
  });

describe('backup codes', () => {
  it('brings back the same progress', () => {
    const p = played();
    expect(decodeBackup(encodeBackup(p))).toEqual(p);
  });

  it('survives line breaks and spaces picked up when pasting', () => {
    const code = encodeBackup(played());
    const pasted = ` ${code.slice(0, 20)}\n${code.slice(20, 50)} \n${code.slice(50)}\n`;
    expect(decodeBackup(pasted)?.tokens).toBe(7);
  });

  it('turns down a code that was cut short or changed', () => {
    const code = encodeBackup(played());
    expect(decodeBackup(code.slice(0, -3))).toBeNull();
    const i = code.indexOf('-') + 5;
    expect(decodeBackup(code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1))).toBeNull();
  });

  it('turns down text that is not a backup code', () => {
    expect(decodeBackup('')).toBeNull();
    expect(decodeBackup('hello')).toBeNull();
    expect(decodeBackup('SHISA1-abc')).toBeNull();
  });

  it('repairs what it brings back like an old save', () => {
    const p = { ...played(), owned: ['not-a-shisa'], age: 'adult' };
    const code = encodeBackup(p as never);
    const back = decodeBackup(code);
    expect(back?.owned).not.toContain('not-a-shisa');
    expect(back?.age).toBeNull();
  });

  it('sums up how far a save has come', () => {
    expect(summary(played())).toEqual({ owned: played().owned.length, tokens: 7, zones: 2 });
  });
});
