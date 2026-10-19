import { describe, expect, it } from 'vitest';
import { findRoute, generate, makeGrid, solve } from '../engine';
import { drawFromSeries, VARIANTS } from './shisa';
import { allowed, type Element, relax, STAGES, stageCfg, TIERS, ZONES } from './zones';

const subsets = <T>(a: readonly T[], max: number): T[][] => {
  const out: T[][] = [[]];
  for (const x of a) for (const s of out.slice()) if (s.length < max) out.push([...s, x]);
  return out;
};

// Every element combination a run can put on a stop, once per distinct piece count
type Case = [string, number, number, Element[]];
const cases: Case[] = ZONES.flatMap((Z, zi): Case[] => {
  const T = TIERS[Z.tier];
  const own = Z.intro ? [Z.intro] : [];
  const older = ZONES.filter((o, i) => i !== zi && o.intro && o.tier <= Z.tier).map((o) => o.intro as Element);
  const all: [number, Element[]][] = [[0, own]];
  for (const si of [1, 2, 3]) for (const s of subsets([...own, ...older], T.counts.length - 1)) all.push([si, s]);
  for (const s of subsets(older, T.bossExtra[1])) if (s.length >= Math.min(T.bossExtra[0], older.length)) all.push([STAGES - 1, [...own, ...s]]);
  const seen = new Set<string>();
  return all
    .filter(([, els]) => allowed(els))
    .filter(([si, els]) => {
      const key = `${si === STAGES - 1 ? 'last' : stageCfg(zi, si, els).k}:${els.join('+')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(([si, els]): Case => [Z.id, zi, si, els]);
});

describe('level generation', () => {
  it.each(cases)('builds a fair level for %s stop %i with %j', { timeout: 30000 }, (_id, zi, si, els) => {
    const cfg = stageCfg(zi, si, els);
    for (const seed of [1, 2, 3]) {
      const lv = generate(cfg, seed * 7919 + zi * 101 + si, relax);
      expect(findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)).toBeNull();
      const { sols } = solve(lv, 20);
      expect(sols.length).toBeGreaterThan(0);
      expect(sols.every((s) => s.length === lv.inv.length)).toBe(true);
      // The stop keeps every element the "next stop" card showed
      for (const t of cfg.must) expect(lv.inv).toContain(t);
      if (cfg.urchin) expect(lv.urchin.length).toBeGreaterThan(0);
      if (cfg.gate) expect(lv.gate).not.toBeNull();
      if (cfg.stars) expect(lv.stars.length).toBeGreaterThan(0);
    }
  });

  it('reproduces the same level from the same seed', () => {
    const cfg = stageCfg(3, 0, ['spring']);
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
