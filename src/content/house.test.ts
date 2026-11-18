import { describe, expect, it } from 'vitest';
import { hasDecorArt } from '../house/DecorArt';
import { DECOR } from './decor';
import { backdrops, clampSpot, freeSpot, HOUSE_CAP, HOUSE_H, HOUSE_W, normalizeHouse, SKY, type Sticker, stickerSize } from './house';
import { placeSeen } from './places';
import { STARTERS, VARIANTS } from './shisa';
import { ZONES } from './zones';

const owned = [...STARTERS, 'gold', 'eisa', 'turtle'];
const pair = [STARTERS[0], STARTERS[1]];
const none = { seen: [] as string[], clears: {} as Record<string, number>, decor: [] as string[] };

describe('the decorations of 西薩的家', () => {
  it('each has art and an id no shisa uses, so a sticker is known by its id alone', () => {
    const shisa = new Set(VARIANTS.map((v) => v.id));
    for (const d of DECOR) {
      expect(hasDecorArt(d.id), d.id).toBe(true);
      expect(shisa.has(d.id), d.id).toBe(false);
    }
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length);
  });
});

describe('where a tapped sticker lands', () => {
  it('lands by the front door in an empty yard', () => {
    const s = freeSpot([]);
    expect(Math.abs(s.x - HOUSE_W / 2)).toBeLessThan(30);
    expect(s.y).toBeGreaterThan(360);
  });

  it('keeps clear of what is already there, and stays in the yard', () => {
    const placed: Sticker[] = [];
    for (let i = 0; i < 4; i++) {
      const s = freeSpot(placed);
      for (const p of placed) expect(Math.hypot(p.x - s.x, p.y - s.y), `#${i}`).toBeGreaterThanOrEqual(60);
      expect(s.y).toBeLessThanOrEqual(HOUSE_H - 6);
      placed.push({ id: `x${i}`, ...s });
    }
  });
});

describe('keeping a sticker inside the picture', () => {
  it('pulls one dropped past an edge back in, whole', () => {
    const { w, h } = stickerSize('gold');
    expect(clampSpot('gold', -50, 9999)).toEqual({ x: Math.round(w / 2), y: HOUSE_H - 6 });
    expect(clampSpot('gold', 9999, 0)).toEqual({ x: Math.round(HOUSE_W - w / 2), y: h });
  });
});

describe('the picture behind the house', () => {
  it('is the sky until a zone has a stop cleared, which opens that zone', () => {
    const fresh = backdrops([], {});
    expect(fresh[0]).toEqual({ id: SKY, name: '藍天', open: true });
    expect(fresh.filter((b) => b.open)).toHaveLength(1);
    expect(fresh).toHaveLength(ZONES.length + 1);
    const later = backdrops([placeSeen('kouri')], { naha: 2 });
    expect(later.filter((b) => b.open).map((b) => b.id)).toEqual([SKY, 'naha', 'kouri']);
  });
});

describe('a saved house', () => {
  it('starts empty in front of the sky', () => {
    expect(normalizeHouse(undefined, { owned, pair, ...none })).toEqual({ bd: SKY, placed: [] });
  });

  it('drops what is not owned, on the roof, repeated or broken, and keeps the rest in place', () => {
    const raw = {
      bd: SKY,
      placed: [
        { id: 'hibiscus', x: 100, y: 400 },
        { id: 'gold', x: 200.4, y: 420.6 },
        { id: 'hibiscus', x: 300, y: 400 },
        { id: STARTERS[0], x: 120, y: 400 },
        { id: 'kingfisher-not-a-shisa', x: 1, y: 1 },
        { id: 'pine', x: 140, y: 410 },
        { id: 'jar', x: 'far', y: 400 },
        null,
      ],
    };
    expect(normalizeHouse(raw, { owned, pair, ...none }).placed).toEqual([
      { id: 'hibiscus', x: 100, y: 400 },
      { id: 'gold', x: 200, y: 421 },
    ]);
  });

  it('keeps a decoration only once it has been turned out of a machine', () => {
    const raw = {
      placed: [
        { id: 'cat', x: 100, y: 400 },
        { id: 'lantern', x: 200, y: 400 },
      ],
    };
    expect(normalizeHouse(raw, { owned, pair, ...none, decor: ['lantern'] }).placed.map((s) => s.id)).toEqual(['lantern']);
  });

  it('keeps at most the cap', () => {
    const many = VARIANTS.map((v, i) => ({ id: v.id, x: 30 + (i % 10) * 30, y: 380 + (i % 3) * 20 }));
    const all = VARIANTS.map((v) => v.id);
    expect(normalizeHouse({ placed: many }, { owned: all, pair, ...none }).placed).toHaveLength(HOUSE_CAP);
  });

  it('goes back to the sky when its picture is of a zone not visited', () => {
    expect(normalizeHouse({ bd: 'miyako', placed: [] }, { owned, pair, ...none }).bd).toBe(SKY);
    expect(normalizeHouse({ bd: 'naha', placed: [] }, { owned, pair, decor: [], seen: [], clears: { naha: 1 } }).bd).toBe('naha');
  });
});
