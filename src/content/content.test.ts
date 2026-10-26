import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { speakable } from '../audio/speech';
import { FREE_LICENSE, OWN_PHOTO, PHOTO_BY_PLACE, SCENE_PLACES } from './credits';
import { PLACE_ORDER, PLACES } from './places';
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
  it('has a postcard for Okinawa and for every zone', () => {
    expect(PLACE_ORDER).toEqual(['okinawa', ...ZONES.map((z) => z.id)]);
  });

  it.each(PLACE_ORDER.map((id) => [PLACES[id].name, PLACES[id]]))('tells %s in a short paragraph with a few sights', (_, p) => {
    expect(spoken(p.story)).toBeGreaterThanOrEqual(60);
    expect(spoken(p.story)).toBeLessThanOrEqual(110);
    expect(p.sights.length).toBeGreaterThanOrEqual(2);
    expect(p.sights.length).toBeLessThanOrEqual(3);
  });
});

describe('postcard pictures', () => {
  it.each(PLACE_ORDER.filter((id) => !SCENE_PLACES.includes(id)))('has a freely licensed, credited photo for %s', (id) => {
    const c = PHOTO_BY_PLACE[id];
    expect(c, id).toBeDefined();
    // Public domain, CC0 or CC BY only: fine for an app store release as long as the credit is shown
    expect(c.license).toMatch(FREE_LICENSE);
    expect(c.author.length).toBeGreaterThan(0);
    // Downloaded photos must point back to their Commons page; our own have no source
    if (c.license !== OWN_PHOTO) expect(c.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    const file = `public/places/${id}.webp`;
    expect(existsSync(file), file).toBe(true);
    expect(statSync(file).size).toBeLessThan(200 * 1024);
  });

  it.each(SCENE_PLACES)('shows the zone’s painted scene for %s, which has no photo', (id) => {
    expect(PHOTO_BY_PLACE[id]).toBeUndefined();
    const file = `public/scenes/${id}/day.webp`;
    expect(existsSync(file), file).toBe(true);
    expect(statSync(file).size).toBeLessThan(200 * 1024);
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
