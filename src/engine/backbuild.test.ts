import { describe, expect, it } from 'vitest';
import type { Element } from '../content/zones';
import { stageCfg, ZONES } from '../content/zones';
import { backbuild, type VinePlan, vinePlans, walkFits } from './backbuild';
import { attemptBackbuild, drawTerrain, judge, methodsFor, rng } from './generator';
import { at, fits, makeGrid, stable } from './grid';
import { findRoute } from './path';
import { HANG_FROM } from './pieces';
import { solve } from './solver';
import type { GenConfig, Level, Placement } from './types';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);

/** Draws terrains until 逆築 builds a road on one, returning the level with its tray and the road */
function built(id: string, els: Element[], seed: number, si = 2) {
  const cfg = stageCfg(zi(id), si, els);
  const r = rng(seed);
  for (let i = 0; i < 5000; i++) {
    const lv = drawTerrain(r, cfg);
    if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) continue;
    const b = backbuild(r, lv, cfg);
    if (b) return { cfg, lv: { ...lv, inv: b.inv }, placed: b.placed };
  }
  throw new Error(`no road built for ${id} ${els.join('+')}`);
}

/** What is left when block `i` is lifted out and everything it held up falls away with it */
function lift(lv: Level, placed: Placement[], i: number): Placement[] {
  let rest = placed.filter((_, j) => j !== i);
  for (let n = rest.length + 1; rest.length < n; ) {
    n = rest.length;
    const g = makeGrid(lv, rest);
    rest = rest.filter((p) => stable(g, p.t, p.o, p.x, p.y));
  }
  return rest;
}

/** Each block, put in the given order, stands where it goes (a vine: hangs from the block above it) */
function standsInOrder(lv: Level, placed: Placement[]): boolean {
  return placed.every((p, i) => {
    const g = makeGrid(lv, placed.slice(0, i));
    return fits(g, p.t, p.o, p.x, p.y) && stable(g, p.t, p.o, p.x, p.y);
  });
}

const CASES: [string, Element[]][] = [
  ['naha', []],
  ['yomitan', ['ladder']],
  ['motobu', ['urchin', 'ladder']],
  ['kouri', ['spring']],
  ['taketomi', ['star', 'urchin']],
  ['shuri', ['gate']],
  ['shuri', ['gate', 'urchin', 'spring']],
];

const VINE_CASES: [string, Element[]][] = [
  ['iriomote', ['vine']],
  ['iriomote', ['vine', 'urchin']],
  ['iriomote', ['vine', 'ladder']],
  ['taketomi', ['star', 'vine']],
  ['kumejima', ['urchin', 'vine']],
];

describe('逆築 (building the answer first)', () => {
  it.each(CASES)('builds a road in %s with %j that needs every block and fits the stage', (id, els) => {
    for (const seed of [1, 2, 3]) {
      const { cfg, lv, placed } = built(id, els, seed);
      expect(placed).toHaveLength(cfg.k);
      expect([...placed.map((p) => p.t)].sort()).toEqual(lv.inv);
      for (const t of cfg.must) expect(lv.inv).toContain(t);
      const g = makeGrid(lv, placed);
      const route = findRoute(g, lv.hero, lv.goal, lv.stars);
      expect(route).not.toBeNull();
      expect(route && walkFits(route, g, lv, cfg)).toBe(true);
      // Every block stands when put in that order, and lifting any one out, with whatever it holds up, breaks the road
      expect(standsInOrder(lv, placed)).toBe(true);
      for (let i = 0; i < placed.length; i++)
        expect(findRoute(makeGrid(lv, lift(lv, placed, i)), lv.hero, lv.goal, lv.stars), `block ${i} is not needed`).toBeNull();
    }
  });

  it('puts a block on the stone gate’s plate', () => {
    const { lv, placed } = built('shuri', ['gate'], 4);
    expect(makeGrid(lv, placed).gateOpen).toBe(true);
  });

  it('tries 逆築 first on every stage, those with a vine included, and takes turns with drawing', () => {
    expect(methodsFor(stageCfg(zi('iriomote'), 2, ['vine']))).toEqual(['backbuild', 'draw']);
    expect(methodsFor(stageCfg(zi('shuri'), 2, ['gate']))).toEqual(['backbuild', 'draw']);
  });
});

describe('逆築 with a vine', () => {
  // Hero on the floor, goal on a tower two rows up: the floor alone never gets there. The answer: a stone bridge on
  // the tower at x = 4, a stair jutting out from it over x = 3, and a vine under the stair to climb up into the arch.
  const cliff = (fixed: Placement[] = []): Level => ({
    w: 6,
    fixed: [{ t: 'tower', o: 0, x: 4, y: 0 }, { t: 'tower', o: 0, x: 5, y: 0 }, ...fixed],
    hero: { x: 0, y: 0 },
    goal: { x: 5, y: 2 },
    inv: [],
    urchin: [],
    stars: [],
    tide: null,
    gate: null,
  });
  const vine: Placement = { t: 'vine', o: 0, x: 3, y: 1 };
  const arch: Placement = { t: 'bridge', o: 0, x: 4, y: 2 };
  const stair: Placement = { t: 'stair', o: 0, x: 3, y: 3 };
  const has = (plans: VinePlan[], blocks: Placement[]) => plans.some((pl) => JSON.stringify(pl) === JSON.stringify({ vine, blocks }));
  const cfg: GenConfig = {
    w: 6,
    k: 3,
    pool: { bridge: 1, stair: 1, vine: 1 },
    must: ['vine'],
    need: ['hang'],
    maxSols: 8,
    urchin: 0,
    tide: null,
    gate: false,
    stars: 0,
    obs: [0, 0],
  };

  it('hangs a vine under a stair whose other end rests on the block beside it', () => {
    expect(has(vinePlans(cliff([arch]), { stair: 1 }), [stair])).toBe(true);
  });

  it('builds a block to hold the stair up when the ground beside the spot has none', () => {
    expect(has(vinePlans(cliff(), { stair: 1, bridge: 1 }), [arch, stair])).toBe(true);
    // With nothing for the stair to rest on, the spot is out of reach
    expect(vinePlans(cliff(), { stair: 1 }).some((pl) => pl.vine.x === 3 && pl.vine.y === 1)).toBe(false);
  });

  it('uses a block of the ground that already juts out, with nothing from the tray', () => {
    expect(has(vinePlans(cliff([arch, stair]), {}), [])).toBe(true);
  });

  it('builds the whole climb when the tray is just the set-up and the vine, and the solver passes it', () => {
    const lv = cliff();
    const b = backbuild(rng(1), lv, cfg);
    expect(b?.inv).toEqual(['bridge', 'stair', 'vine']);
    expect(b?.placed[2]).toEqual(vine);
    const route = b && findRoute(makeGrid(lv, b.placed), lv.hero, lv.goal);
    expect(route?.some((p) => p.via === 'hang')).toBe(true);
    expect(b && judge({ ...lv, inv: b.inv }, cfg)).not.toBeNull();
  });

  it('only sets up spots where the vine really hangs once its blocks are in', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const c = stageCfg(zi('iriomote'), 2, ['vine']);
      const r = rng(seed);
      let lv: Level | null = null;
      while (!lv) lv = drawTerrain(r, c);
      const plans = vinePlans(lv, c.pool);
      expect(plans.length).toBeGreaterThan(0);
      for (const { vine: v, blocks } of plans) {
        expect(blocks.length).toBeLessThanOrEqual(2);
        expect(standsInOrder(lv, [...blocks, v])).toBe(true);
        expect(HANG_FROM.has(at(makeGrid(lv, blocks), v.x, v.y + 2)?.k ?? '')).toBe(true);
        // A block built to hold the hanger up is needed: the hanger would not stand without it
        if (blocks.length === 2) expect(stable(makeGrid(lv, [v]), blocks[1].t, blocks[1].o, blocks[1].x, blocks[1].y)).toBe(false);
      }
    }
  });

  it.each(VINE_CASES)('builds a road in %s with %j that climbs the vine and needs every block', (id, els) => {
    for (const seed of [1, 2, 3]) {
      const { cfg, lv, placed } = built(id, els, seed);
      expect(placed).toHaveLength(cfg.k);
      expect([...placed.map((p) => p.t)].sort()).toEqual(lv.inv);
      for (const t of cfg.must) expect(lv.inv).toContain(t);
      // The vine goes in last, and every block stands (or hangs) when put in that order
      expect(placed[placed.length - 1].t).toBe('vine');
      expect(standsInOrder(lv, placed)).toBe(true);
      const g = makeGrid(lv, placed);
      const route = findRoute(g, lv.hero, lv.goal, lv.stars);
      expect(route?.some((p) => p.via === 'hang')).toBe(true);
      expect(route && walkFits(route, g, lv, cfg)).toBe(true);
      // Lifting any block out, with whatever it holds up, breaks the road
      for (let i = 0; i < placed.length; i++)
        expect(findRoute(makeGrid(lv, lift(lv, placed, i)), lv.hero, lv.goal, lv.stars), `block ${i} is not needed`).toBeNull();
    }
  });

  it('builds the first stop’s two-block lesson around the vine', () => {
    const { lv, placed } = built('iriomote', ['vine'], 1, 0);
    expect(placed).toHaveLength(2);
    const route = findRoute(makeGrid(lv, placed), lv.hero, lv.goal, lv.stars);
    expect(route?.some((p) => p.via === 'hang')).toBe(true);
  });

  it('makes levels the solver passes, where every way to win climbs the vine', () => {
    const cfg = stageCfg(zi('iriomote'), 2, ['vine']);
    const r = rng(8);
    const levels: Level[] = [];
    for (let i = 0; i < 3000 && levels.length < 3; i++) {
      const lv = attemptBackbuild(r, cfg);
      if (lv) levels.push(lv);
    }
    expect(levels).toHaveLength(3);
    for (const lv of levels) {
      const { sols } = solve(lv, 20);
      expect(sols.length).toBeGreaterThan(0);
      for (const sol of sols) {
        expect(sol).toHaveLength(lv.inv.length);
        expect(findRoute(makeGrid(lv, sol), lv.hero, lv.goal, lv.stars)?.some((p) => p.via === 'hang')).toBe(true);
      }
    }
  });
});
