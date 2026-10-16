import { describe, expect, it } from 'vitest';
import { findRoute, generate, makeGrid, solve } from '../engine';
import { drawFromSeries, VARIANTS } from './shisa';
import { type CardKey, relax, STAGES, stageCfg, ZONES } from './zones';

// Every zone × stage × path card must produce a fair level from a handful of seeds
type Case = [number, number, CardKey | null];
const cases: Case[] = ZONES.flatMap((Z, zi): Case[] => [
  ...[0, 1, 2, 3].flatMap((si): Case[] => (si === 0 ? [[zi, si, null]] : Z.cards.map((c): Case => [zi, si, c]))),
  [zi, STAGES - 1, null],
]);

describe('level generation', () => {
  it.each(cases)('builds a fair level for zone %i stage %i card %s', (zi, si, card) => {
    const cfg = stageCfg(zi, si, card);
    for (const seed of [1, 2, 3]) {
      const lv = generate(cfg, seed * 7919 + zi * 101 + si, relax);
      expect(findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)).toBeNull();
      const { sols } = solve(lv, 20);
      expect(sols.length).toBeGreaterThan(0);
      expect(sols.every((s) => s.length === lv.inv.length)).toBe(true);
    }
  });

  it('reproduces the same level from the same seed', () => {
    const cfg = stageCfg(3, 0, null);
    expect(generate(cfg, 42, relax)).toEqual(generate(cfg, 42, relax));
  });
});

describe('gacha draw', () => {
  it('never returns a shisa the player already owns', () => {
    const owned = VARIANTS.filter((v) => v.series === 'sea')
      .slice(0, 4)
      .map((v) => v.id);
    for (let i = 0; i < 50; i++) expect(owned).not.toContain(drawFromSeries('sea', owned)?.id);
  });

  it('returns nothing once a series is complete', () => {
    const owned = VARIANTS.filter((v) => v.series === 'fest').map((v) => v.id);
    expect(drawFromSeries('fest', owned)).toBeNull();
  });
});
