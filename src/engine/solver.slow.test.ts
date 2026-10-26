import { describe, expect, it } from 'vitest';
import { type Element, STAGES, stageCfg, ZONES } from '../content/zones';
import { backbuild } from './backbuild';
import { attempt, drawTerrain, type Rng, rng } from './generator';
import { fits, makeGrid, placementsFor } from './grid';
import { findRoute } from './path';
import { DEFS, H } from './pieces';
import { hasSolution, solve } from './solver';
import { hasSolution as hasSolutionRef, solve as solveRef } from './solver.reference';
import type { GenConfig, Level, PieceType, Placement } from './types';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);

/** A stage's config by zone, stop and elements, with optional changes such as more blocks than the zone hands out today */
type Case = [string, string, number, Element[], Partial<GenConfig>?];
const CASES: Case[] = [
  ['那霸市, first stop', 'naha', 0, []],
  ['那霸市, last stop', 'naha', STAGES - 1, []],
  ['ladder', 'yomitan', 2, ['ladder']],
  ['urchin and ladder', 'motobu', 2, ['urchin', 'ladder']],
  ['spring', 'kouri', 3, ['spring']],
  ['long bridge', 'nakagusuku', 3, ['long']],
  ['long bridge and urchin', 'nakagusuku', 3, ['long', 'urchin']],
  ['star and urchin', 'ishigaki', 2, ['star', 'urchin']],
  ['two stars, 3 blocks', 'ishigaki', 2, ['star'], { stars: 2, k: 3 }],
  ['two stars, 4 blocks', 'ishigaki', 2, ['star'], { stars: 2, k: 4, w: 8 }],
  ['vine', 'yanbaru', 2, ['vine']],
  ['vine and urchin', 'yanbaru', 2, ['vine', 'urchin']],
  ['vine, 4 blocks', 'yanbaru', 2, ['vine'], { k: 4, w: 7, obs: [0, 3] }],
  ['slide', 'miyako', 2, ['slide']],
  ['slide and spring', 'miyako', 2, ['slide', 'spring']],
  ['gate', 'shuri', 1, ['gate']],
  ['gate, urchin and spring', 'shuri', 2, ['gate', 'urchin', 'spring']],
  ['gate and ladder, 8 wide', 'shuri', 2, ['gate', 'ladder'], { w: 8, k: 4 }],
  ['gate, 5 blocks, 9 wide', 'shuri', 2, ['gate'], { w: 9, k: 5, obs: [0, 4] }],
  ['tide', 'kumejima', 2, ['tide']],
  ['tide and ladder', 'kumejima', 2, ['tide', 'ladder']],
  ['tide and slide, 7 wide', 'kumejima', 2, ['tide', 'slide'], { w: 7, k: 4 }],
  ['tide, 5 blocks, 7 wide', 'kumejima', 2, ['tide'], { w: 7, k: 5, obs: [0, 3] }],
  ['spring and urchin, 5 blocks, 7 wide', 'kouri', 2, ['spring', 'urchin'], { w: 7, k: 5, obs: [0, 3] }],
];

/**
 * Levels for a stage: raw draws (mostly with no solution), and solvable ones, which 逆築 builds a road on (or, for a
 * vine, which 逆築 cannot build, the draws that pass the generator's checks)
 */
function levelsFor([, id, si, els, over]: Case, n: number): { cfg: GenConfig; lvs: Level[] } {
  const cfg = { ...stageCfg(zi(id), si, els), ...over };
  const r = rng(zi(id) * 977 + si * 31 + els.length * 7 + (over?.k ?? 0));
  const lvs: Level[] = [];
  for (let i = 0; i < 4000 && lvs.length < n; i++) {
    const lv = drawTerrain(r, cfg);
    if (lv && !findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) lvs.push(lv);
  }
  const vine = cfg.must.includes('vine');
  for (let i = 0, built = 0; i < 4000 && built < n; i++) {
    const lv = vine ? attempt(r, cfg) : drawTerrain(r, cfg);
    if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) continue;
    const b = vine ? { inv: lv.inv } : backbuild(r, lv, cfg);
    if (!b) continue;
    lvs.push({ ...lv, inv: b.inv });
    built++;
  }
  return { cfg, lvs };
}

const pick = <T>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)];
const TYPES = Object.keys(DEFS) as PieceType[];

/**
 * A level that follows none of the generator's habits: blocks anywhere they fit (floating ones too), figures and star
 * sand anywhere, any tide, a plate off the floor. The pruning has to hold for every level, not just for drawn ones.
 */
function oddLevel(r: Rng): Level {
  const w = 5 + Math.floor(r() * 4);
  const lv: Level = { w, fixed: [], hero: { x: 0, y: 0 }, goal: { x: w - 1, y: 0 }, inv: [], urchin: [], stars: [], tide: null, gate: null };
  const free = () => {
    for (let i = 0; i < 50; i++) {
      const p = { x: Math.floor(r() * w), y: Math.floor(r() * 3) };
      if (!makeGrid(lv, []).cells[p.x * H + p.y]) return p;
    }
    return null;
  };
  lv.hero = { x: Math.floor(r() * w), y: Math.floor(r() * 3) };
  lv.goal = free() ?? lv.goal;
  for (let n = Math.floor(r() * 3); n > 0; n--) {
    const s = free();
    if (s) lv.stars.push(s);
  }
  if (r() < 0.3) lv.tide = { every: 1 + Math.floor(r() * 2), max: 1 + Math.floor(r() * 2) };
  if (r() < 0.3) lv.urchin.push(Math.floor(r() * w));
  if (r() < 0.35) {
    const x = Math.floor(r() * w);
    const g = makeGrid(lv, []);
    if (![0, 1].some((y) => g.cells[x * H + y])) {
      const plate = free();
      if (plate && plate.x !== x) lv.gate = { x, h: 1 + Math.floor(r() * 2), px: plate.x, py: plate.y };
    }
  }
  for (let n = Math.floor(r() * 7); n > 0; n--) {
    const t = pick(r, TYPES);
    const o = Math.floor(r() * DEFS[t].orients.length);
    const g = makeGrid(lv, []);
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * 3);
    if (r() < 0.6) {
      const opts = placementsFor(g, t, o);
      if (opts.length) lv.fixed.push(pick(r, opts));
    } else if (fits(g, t, o, x, y)) lv.fixed.push({ t, o, x, y });
  }
  // Up to five blocks on narrow ground, so the search goes deep without taking long
  const k = 1 + Math.floor(r() * (w <= 6 ? 5 : 4));
  for (let n = 0; n < k; n++) lv.inv.push(pick(r, TYPES));
  lv.inv.sort();
  return lv;
}

/** Each block of a solution can be put down, in that order, where the solution says */
function buildable(lv: Level, sol: readonly Placement[]): boolean {
  return sol.every((p, i) => placementsFor(makeGrid(lv, sol.slice(0, i)), p.t, p.o).some((q) => q.x === p.x && q.y === p.y));
}

function expectSameAnswers(lv: Level, maxSols: number) {
  const ref = solveRef(lv);
  const got = solve(lv);
  // The same solutions, found in the same order, with no more positions looked at
  expect(got.sols).toEqual(ref.sols);
  expect(got.nodes).toBeLessThanOrEqual(ref.nodes);
  for (const sol of got.sols) expect(buildable(lv, sol)).toBe(true);
  // The generator's judge: stop at a win with fewer blocks, or past the stage's limit
  const judgeRef = solveRef(lv, maxSols + 1, { minLen: lv.inv.length });
  const judge = solve(lv, maxSols + 1, { minLen: lv.inv.length });
  expect(judge.sols).toEqual(judgeRef.sols);
  expect(judge.short).toBe(judgeRef.short);
  expect(solve(lv, 1).sols).toEqual(ref.sols.slice(0, 1));
  // The cheap filter answers the same whenever the old one did within its budget, and is never wrong
  const any = ref.sols.length > 0;
  expect(hasSolution(lv, Number.POSITIVE_INFINITY)).toBe(any);
  for (const budget of [1, 20, 200]) {
    const before = hasSolutionRef(lv, budget);
    const now = hasSolution(lv, budget);
    if (before !== null) expect(now).toBe(before);
    if (now !== null) expect(now).toBe(any);
  }
}

describe('solver with relevance pruning', () => {
  it.each(CASES)('gives the same answers as before with %s', { timeout: 120000 }, (...c) => {
    const { cfg, lvs } = levelsFor(c, 3);
    expect(lvs.length).toBeGreaterThan(3);
    for (const lv of lvs) expectSameAnswers(lv, cfg.maxSols);
  });

  it('gives the same answers as before on levels unlike any the generator draws', { timeout: 120000 }, () => {
    const r = rng(2026);
    for (let i = 0; i < 400; i++) expectSameAnswers(oddLevel(r), 3);
  });

  it('stops at once when the cap is zero', () => {
    const { lvs } = levelsFor(CASES[0], 1);
    expect(solve(lvs[0], 0)).toEqual({ sols: [], nodes: 0, short: false });
  });
});
