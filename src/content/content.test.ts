import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { speakable } from '../audio/speech';
import { CARD_TOTAL, cardsEarned, cardUrl, PLACE_ORDER, PLACES, placeSeen } from './places';
import { ABOUT_SHISA, SERIES, VARIANTS } from './shisa';
import { PIECE_NAMES, RULES } from './text';
import { ZONES } from './zones';

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
    // Every Japanese word sits in brackets right after its Chinese reading
    expect(story.replace(/(?<=[\u4e00-\u9fff])（[\u3040-\u30FF]+）/g, '')).not.toMatch(/[\u3040-\u30FF]/);
  });

  it('explains what a shisa is', () => {
    expect(spoken(ABOUT_SHISA.story)).toBeGreaterThan(80);
  });
});

describe('place postcards', () => {
  it('has one card for Okinawa and three for every zone', () => {
    expect(PLACE_ORDER).toEqual(['okinawa', ...ZONES.map((z) => z.id)]);
    expect(PLACES.okinawa.cards).toHaveLength(1);
    for (const Z of ZONES) expect(PLACES[Z.id as keyof typeof PLACES].cards, Z.id).toHaveLength(3);
    expect(CARD_TOTAL).toBe(1 + 3 * ZONES.length);
  });

  const cards = PLACE_ORDER.flatMap((id) => PLACES[id].cards.map((c, n) => [`${PLACES[id].name} ${c.name}`, id, n, c] as const));

  it.each(cards)('tells %s in a short paragraph a parent can read aloud, with a few things to spot', (_, id, n, c) => {
    // A zone's first card tells the whole zone; the others, just the sight
    expect(spoken(c.story)).toBeGreaterThanOrEqual(n === 0 ? 60 : 40);
    expect(spoken(c.story)).toBeLessThanOrEqual(110);
    expect(c.story.replace(/(?<=[\u4e00-\u9fff])（[\u3040-\u30FF]+）/g, '')).not.toMatch(/[\u3040-\u30FF]/);
    expect(c.sights.length, id).toBeGreaterThanOrEqual(2);
    expect(c.sights.length, id).toBeLessThanOrEqual(3);
  });

  it.each(cards.filter(([, id]) => id !== 'okinawa'))('has an illustration of %s, large and small', (_, id, n) => {
    for (const small of [false, true]) {
      const file = `public${cardUrl(id, n, small)}`;
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeLessThan((small ? 30 : 250) * 1024);
    }
  });
});

describe('earning postcards', () => {
  it('gives Okinawa’s card from the start', () => {
    expect(cardsEarned('okinawa', [], {})).toBe(1);
  });

  it('gives a zone’s first card with its first stop cleared, the next two with its second and third journey', () => {
    expect(cardsEarned('onna', [], {})).toBe(0);
    expect(cardsEarned('onna', [placeSeen('onna')], {})).toBe(1);
    expect(cardsEarned('onna', [], { onna: 1 })).toBe(1);
    expect(cardsEarned('onna', [placeSeen('onna')], { onna: 2 })).toBe(2);
    expect(cardsEarned('onna', [placeSeen('onna')], { onna: 7 })).toBe(3);
  });
});

describe('read-aloud text', () => {
  it('says the reading and skips the Japanese word after it', () => {
    expect(speakable('叫牠「西薩（シーサー）」')).toBe('叫牠「西薩」');
  });

  it('drops stray kana a Mandarin voice cannot say', () => {
    expect(speakable('獅子シーサー')).toBe('獅子');
  });
});

describe('zones', () => {
  it('names and explains every piece', () => {
    for (const t of Object.keys(PIECE_NAMES) as (keyof typeof PIECE_NAMES)[]) expect(RULES[t]).toBeTruthy();
  });

  it('gives every zone a unique id and teaches each element in one zone only', () => {
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length);
    const taught = ZONES.flatMap((Z) => (Z.intro ? [Z.intro] : []));
    expect(new Set(taught).size).toBe(taught.length);
  });

  it('starts with plain building and never lets the tiers go back down', () => {
    expect(ZONES[0].tier).toBe(0);
    expect(ZONES[0].intro).toBeNull();
    for (let i = 1; i < ZONES.length; i++) expect(ZONES[i].tier, ZONES[i].id).toBeGreaterThanOrEqual(ZONES[i - 1].tier);
  });
});
