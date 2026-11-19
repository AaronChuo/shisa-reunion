import { describe, expect, it } from 'vitest';
import { hasDecorArt } from '../house/DecorArt';
import { DECOR, DECOR_PER_MACHINE, drawDecor, hasDecor, leftIn, priceOf, readyToGoUp, roundOf, STARTER_DECOR, upgradeSeen, upgradeText } from './decor';
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
  const animal = [...STARTERS, ...allOf('animal')];
  const up = { owned: animal, decor: [] as string[], seen: [upgradeSeen('animal')] };

  it('turns out shisa until all of its series are collected and it has been seen going up, then decorations', () => {
    expect(roundOf('trad', { owned: STARTERS, seen: [] })).toBe(1);
    expect(leftIn('trad', { owned: STARTERS, decor: [], seen: [] })).toBe(allOf('trad').length - 2);
    expect(roundOf('animal', up)).toBe(2);
    expect(leftIn('animal', up)).toBe(DECOR_PER_MACHINE);
    expect(leftIn('animal', { ...up, decor: ['cat', 'gecko'] })).toBe(DECOR_PER_MACHINE - 2);
  });

  it('stays in round 1, empty, from the last shisa until the machine is seen going up', () => {
    const justIn = { owned: animal, decor: [] as string[], seen: [] as string[] };
    expect(roundOf('animal', justIn)).toBe(1);
    expect(leftIn('animal', justIn)).toBe(0);
    expect(priceOf('animal', justIn, 'big')).toBe(1);
    expect(readyToGoUp('animal', justIn)).toBe(true);
    expect(readyToGoUp('animal', up)).toBe(false);
    expect(readyToGoUp('trad', { owned: STARTERS, seen: [] })).toBe(false);
  });

  it('costs one coin, and two in round 2 for children 6 and up', () => {
    expect(priceOf('trad', up, 'big')).toBe(1);
    expect(priceOf('animal', up, 'little')).toBe(1);
    expect(priceOf('animal', up, null)).toBe(1);
    expect(priceOf('animal', up, 'kid')).toBe(2);
    expect(priceOf('animal', up, 'big')).toBe(2);
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

describe('the upgrade notice', () => {
  it("counts the machine's shisa and names the price only when a capsule takes two coins", () => {
    const trad = SERIES.find((se) => se.id === 'trad');
    const craft = SERIES.find((se) => se.id === 'craft');
    if (!trad || !craft) throw new Error('missing series');
    expect(upgradeText(trad, false)).toMatch(/^傳統系列的 10 隻西薩都收齊了！/);
    expect(upgradeText(craft, false)).toMatch(/^工藝系列的 5 隻西薩都收齊了！/);
    expect(upgradeText(trad, false)).not.toContain('2 枚');
    expect(upgradeText(trad, true)).toMatch(/升級後每轉一次要投 2 枚福氣幣。$/);
  });
});
