import { describe, expect, it } from 'vitest';
import { hasDecorArt } from '../house/DecorArt';
import { DECOR, DECOR_PER_MACHINE, drawDecor, hasDecor, leftIn, priceOf, roundOf, STARTER_DECOR } from './decor';
import { SERIES, STARTERS, VARIANTS } from './shisa';

const allOf = (series: string) => VARIANTS.filter((v) => v.series === series).map((v) => v.id);

describe('the decorations', () => {
  it('each have art, a name, a note and an id no shisa uses', () => {
    const shisa = new Set(VARIANTS.map((v) => v.id));
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length);
    for (const d of DECOR) {
      expect(hasDecorArt(d.id), d.id).toBe(true);
      expect(shisa.has(d.id), d.id).toBe(false);
      expect(d.name && d.note, d.id).toBeTruthy();
    }
  });

  it('start with three in every house, and give each machine eight with one rare', () => {
    expect(STARTER_DECOR).toEqual(['hibiscus', 'stone', 'jar']);
    for (const se of SERIES) {
      const mine = DECOR.filter((d) => d.series === se.id);
      expect(mine, se.id).toHaveLength(DECOR_PER_MACHINE);
      expect(
        mine.filter((d) => d.rare),
        se.id,
      ).toHaveLength(1);
    }
    expect(DECOR).toHaveLength(3 + SERIES.length * DECOR_PER_MACHINE);
  });

  it('count as the player’s when they are a starter or have been turned out', () => {
    expect(hasDecor('stone', [])).toBe(true);
    expect(hasDecor('cat', [])).toBe(false);
    expect(hasDecor('cat', ['cat'])).toBe(true);
  });
});

describe('a gacha machine’s rounds', () => {
  it('turns out shisa until all of its series are collected, then decorations', () => {
    expect(roundOf('trad', STARTERS)).toBe(1);
    expect(leftIn('trad', STARTERS, [])).toBe(allOf('trad').length - 2);
    const owned = [...STARTERS, ...allOf('animal')];
    expect(roundOf('animal', owned)).toBe(2);
    expect(leftIn('animal', owned, [])).toBe(DECOR_PER_MACHINE);
    expect(leftIn('animal', owned, ['cat', 'gecko'])).toBe(DECOR_PER_MACHINE - 2);
  });

  it('costs one coin, and two in round 2 for children 6 and up', () => {
    const owned = [...STARTERS, ...allOf('animal')];
    expect(priceOf('trad', owned, 'big')).toBe(1);
    expect(priceOf('animal', owned, 'little')).toBe(1);
    expect(priceOf('animal', owned, null)).toBe(1);
    expect(priceOf('animal', owned, 'kid')).toBe(2);
    expect(priceOf('animal', owned, 'big')).toBe(2);
  });

  it('never turns out a decoration twice, and the rare one comes less often', () => {
    const got: string[] = [];
    for (let i = 0; i < DECOR_PER_MACHINE; i++) {
      const d = drawDecor('sea', got);
      expect(d && !got.includes(d.id)).toBe(true);
      if (d) got.push(d.id);
    }
    expect(drawDecor('sea', got)).toBeNull();
    // With a random number at the very top of the range, the last in the pool comes out; the rare one has a third of the weight
    let rare = 0;
    for (let i = 0; i < 300; i++) if (drawDecor('sea', [], () => i / 300)?.rare) rare++;
    expect(rare).toBeGreaterThan(5);
    expect(rare).toBeLessThan(300 / 8);
  });
});
