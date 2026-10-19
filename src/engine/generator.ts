import { backbuild, walkFits } from './backbuild';
import { makeGrid, placementsFor } from './grid';
import { findRoute, surfaces } from './path';
import { cellsOf, DEFS } from './pieces';
import { hasSolution, solve } from './solver';
import type { GenConfig, Level, PieceType, Placement, Pos } from './types';

export type Rng = () => number;

/** Seeded PRNG (mulberry32) so a run can be reproduced from its seed */
export function rng(seed: number): Rng {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Positions per board column the quick solvability check may visit before giving up on a draw */
const SEARCH_BUDGET = 20;

const STACKS: PieceType[][] = [[], ['cube'], ['tower'], ['tower', 'cube'], ['cube', 'cube']];
const stackH = (s: PieceType[]) => s.reduce((a, t) => a + (t === 'tower' ? 2 : 1), 0);

/** A random terrain for the config with the blocks for the tray, not yet checked for a road; null when the draw fails */
export function drawTerrain(r: Rng, cfg: GenConfig): Level | null {
  const w = cfg.w;
  const pick = <T>(a: T[]): T => a[Math.floor(r() * a.length)];
  // Fixed blocks for the figures' stands and the terrain; wider ground gets more, and from 9 columns a stone bridge too
  const more = Math.max(0, w - 8);
  const fixedPool: Partial<Record<PieceType, number>> = { tower: 2 + more, cube: 3 + more, stair: 1 + more, bridge: 1, long: more ? 1 : 0 };
  const takeFixed = (t: PieceType) => {
    if (!fixedPool[t]) return false;
    fixedPool[t] -= 1;
    return true;
  };
  const fixed: Placement[] = [];
  let hx = r() < 0.6 ? 0 : 1;
  let gx = r() < 0.6 ? w - 1 : w - 2;
  if (r() < 0.5) [hx, gx] = [w - 1 - hx, w - 1 - gx];
  const minH = cfg.tide ? cfg.tide.max : 0;
  const chars: Pos[] = [];
  for (const x of [hx, gx]) {
    const s = pick(STACKS.filter((st) => stackH(st) >= minH));
    let y = 0;
    for (const t of s) {
      if (!takeFixed(t)) return null;
      fixed.push({ t, o: 0, x, y });
      y += t === 'tower' ? 2 : 1;
    }
    chars.push({ x, y });
  }
  const lv: Level = { w, fixed, hero: chars[0], goal: chars[1], inv: [], urchin: [], stars: [], tide: cfg.tide, gate: null };
  const reserved = new Set([hx, gx]);
  if (cfg.gate) {
    const gateCols: number[] = [];
    for (let x = Math.min(hx, gx) + 1; x < Math.max(hx, gx); x++) gateCols.push(x);
    if (!gateCols.length) return null;
    const gc = pick(gateCols);
    reserved.add(gc);
    const plateCols: number[] = [];
    for (let x = 0; x < w; x++) if (!reserved.has(x)) plateCols.push(x);
    const pc = pick(plateCols);
    reserved.add(pc);
    lv.gate = { x: gc, h: r() < 0.6 ? 2 : 1, px: pc, py: 0 };
  }
  for (let n = 0; n < cfg.urchin; n++) {
    const free: number[] = [];
    for (let x = 0; x < w; x++) if (!reserved.has(x) && !lv.urchin.includes(x)) free.push(x);
    if (!free.length) break;
    lv.urchin.push(pick(free));
  }
  const [omin, omax] = cfg.obs;
  const nObs = omin + Math.floor(r() * (omax - omin + 1));
  for (let n = 0; n < nObs; n++) {
    const types = (Object.keys(fixedPool) as PieceType[]).filter((t) => (fixedPool[t] ?? 0) > 0);
    if (!types.length) break;
    const t = pick(types);
    const o = Math.floor(r() * DEFS[t].orients.length);
    const opts = placementsFor(makeGrid(lv, []), t, o).filter((p) => cellsOf(t, o).every(([dx]) => !reserved.has(p.x + dx)));
    if (!opts.length) continue;
    takeFixed(t);
    fixed.push(pick(opts));
  }
  // Star sand goes on a spot the hero could stand on before anything is built, away from both figures
  if (cfg.stars) {
    const floor = cfg.tide ? cfg.tide.max : 0;
    const spots = surfaces(makeGrid(lv, [])).filter((s) => !s.ramp && !s.hang && !reserved.has(s.x) && s.y >= floor);
    for (let n = 0; n < cfg.stars && spots.length; n++) {
      const s = spots.splice(Math.floor(r() * spots.length), 1)[0];
      if (lv.stars.some((p) => p.x === s.x)) continue;
      lv.stars.push({ x: s.x, y: s.y });
    }
    if (lv.stars.length < cfg.stars) return null;
  }
  const pool = { ...cfg.pool };
  const inv: PieceType[] = [];
  for (const t of cfg.must) {
    if (!pool[t]) return null;
    pool[t] -= 1;
    inv.push(t);
  }
  while (inv.length < cfg.k) {
    const types = (Object.keys(pool) as PieceType[]).filter((t) => (pool[t] ?? 0) > 0);
    if (!types.length) return null;
    const t = pick(types);
    pool[t] = (pool[t] ?? 0) - 1;
    inv.push(t);
  }
  inv.sort();
  lv.inv = inv;
  return lv;
}

/**
 * The solver's verdict on a level: it qualifies when it starts unsolved, is solvable, every solution uses every loose
 * piece, and every solution makes the required moves and goes through an open stone gate.
 */
export function judge(lv: Level, cfg: GenConfig): Level | null {
  if (findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) return null;
  // A win with fewer pieces stops the search at once: the level would not need every piece
  const { sols, short } = solve(lv, cfg.maxSols + 1, { minLen: lv.inv.length });
  if (short || !sols.length || sols.length > cfg.maxSols) return null;
  for (const sol of sols) {
    const g = makeGrid(lv, sol);
    const path = findRoute(g, lv.hero, lv.goal, lv.stars);
    if (!path || !walkFits(path, g, lv, cfg)) return null;
  }
  lv.solutions = sols.length;
  return lv;
}

/** Draw and check: a random terrain and tray, kept only if the solver finds it fair. Most draws have no road. */
export function attempt(r: Rng, cfg: GenConfig): Level | null {
  const lv = drawTerrain(r, cfg);
  if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) return null;
  // Cheap filter first: most draws have no solution, and a solvable one usually shows a solution early
  if (hasSolution(lv, SEARCH_BUDGET * cfg.w) !== true) return null;
  return judge(lv, cfg);
}

/** 逆築: a random terrain and tray, with the road built first so only levels known to be solvable go to the solver */
export function attemptBackbuild(r: Rng, cfg: GenConfig): Level | null {
  const lv = drawTerrain(r, cfg);
  if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) return null;
  const built = backbuild(r, lv, cfg);
  if (!built) return null;
  lv.inv = built.inv;
  return judge(lv, cfg);
}

export type Method = 'backbuild' | 'draw';

/**
 * The ways to generate a stage, in the order to try them: 逆築 first, with drawing as the fallback it takes turns with.
 * A stage with a vine is built the same way, starting from where the vine hangs.
 */
export function methodsFor(_cfg: GenConfig): Method[] {
  return ['backbuild', 'draw'];
}

/**
 * Keeps generating until a level qualifies, taking turns between the config's methods while they keep failing
 * (`sliceMs`: the first method's turn, then the other's). After `stepMs` without success it asks `relax` for an easier
 * config (up to `maxStep` times), so generation always finishes.
 */
export function generate(
  cfg: GenConfig,
  seed: number,
  relax: (cfg: GenConfig, step: number) => GenConfig,
  { stepMs = 2200, maxStep = 4, now = () => performance.now(), sliceMs = [700, 250] as [number, number] } = {},
): Level {
  const r = rng(seed);
  let step = 0;
  let cur = cfg;
  let since = now();
  const methods = methodsFor(cfg);
  let turn = 0;
  let turnStart = since;
  for (;;) {
    const lv = methods[turn] === 'backbuild' ? attemptBackbuild(r, cur) : attempt(r, cur);
    if (lv) return lv;
    const t = now();
    if (methods.length > 1 && t - turnStart > sliceMs[turn === 0 ? 0 : 1]) {
      turn = (turn + 1) % methods.length;
      turnStart = t;
    }
    if (t - since > stepMs && step < maxStep) {
      step += 1;
      cur = relax(cfg, step);
      since = t;
    }
  }
}
