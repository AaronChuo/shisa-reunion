import { describe, expect, it } from 'vitest';
import { speakable } from '../audio/speech';
import { ABOUT_SHISA, SERIES, VARIANTS } from './shisa';
import { PIECE_NAMES, RULES } from './text';
import { CARDS, ZONES } from './zones';

// Characters a parent actually reads out: what's left once Japanese words are swapped for their readings
const spoken = (s: string) => speakable(s).replace(/[「」〈〉（）、，。：；！？\s]/g, '').length;

describe('shisa collection', () => {
  it('fills every series with distinct shisa and at least one rare one', () => {
    expect(new Set(VARIANTS.map((v) => v.id)).size).toBe(VARIANTS.length);
    for (const s of SERIES) {
      const vs = VARIANTS.filter((v) => v.series === s.id);
      expect(vs.length, s.id).toBeGreaterThanOrEqual(5);
      expect(
        vs.some((v) => v.rare),
        s.id,
      ).toBe(true);
    }
  });

  it.each(VARIANTS.map((v) => [v.name, v.story]))('tells a short story for %s that can be read aloud', (_, story) => {
    expect(spoken(story)).toBeGreaterThanOrEqual(40);
    expect(spoken(story)).toBeLessThanOrEqual(100);
    // Every Japanese word comes with a reading in brackets
    expect(story.replace(/[぀-ヿ]+（[^）]+）/g, '')).not.toMatch(/[぀-ヿ]/);
  });

  it('explains what a shisa is', () => {
    expect(spoken(ABOUT_SHISA.story)).toBeGreaterThan(80);
  });
});

describe('read-aloud text', () => {
  it('says the reading in place of the Japanese word', () => {
    expect(speakable('叫牠「シーサー（西薩）」')).toBe('叫牠「西薩」');
  });

  it('drops stray kana a Mandarin voice cannot say', () => {
    expect(speakable('獅子シーサー')).toBe('獅子');
  });
});

describe('zones and cards', () => {
  it('names and explains every piece', () => {
    for (const t of Object.keys(PIECE_NAMES) as (keyof typeof PIECE_NAMES)[]) expect(RULES[t]).toBeTruthy();
  });

  it('only offers cards that exist, and every zone has a unique id', () => {
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length);
    for (const Z of ZONES) for (const c of Z.cards) expect(CARDS[c], `${Z.id}:${c}`).toBeDefined();
  });

  it('only asks for pieces the zone can hand out', () => {
    for (const Z of ZONES) {
      const asks = [...(Z.first?.must ?? []), ...(Z.boss.must ?? []), ...Z.cards.flatMap((c) => CARDS[c].must ?? [])];
      for (const t of asks) expect(Z.pool[t], `${Z.id} needs ${t}`).toBeGreaterThan(0);
    }
  });
});
