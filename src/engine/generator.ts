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

/**
 * One random level for the config, or null when the draw doesn't qualify.
 * A level qualifies when it starts unsolved, is solvable, every solution uses every loose piece,
 * and every solution satisfies the config's required move / open gate.
 */
export function attempt(r: Rng, cfg: GenConfig): Level | null {
  const w = cfg.w;
  const pick = <T>(a: T[]): T => a[Math.floor(r() * a.length)];
  const fixedPool: Partial<Record<PieceType, number>> = { tower: 2, cube: 3, stair: 1, bridge: 1 };
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
  if (findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) return null;
  // Cheap filter first: most draws have no solution, and a solvable one usually shows a solution early
  if (hasSolution(lv, SEARCH_BUDGET * cfg.w) !== true) return null;
  const { sols } = solve(lv, cfg.maxSols + 1);
  if (!sols.length || sols.length > cfg.maxSols) return null;
  if (sols.some((s) => s.length < cfg.k)) return null;
  for (const sol of sols) {
    const g = makeGrid(lv, sol);
    const path = findRoute(g, lv.hero, lv.goal, lv.stars);
    if (!path) return null;
    if (cfg.need.some((m) => !path.some((p) => p.via === m))) return null;
    const gate = lv.gate;
    if (gate && !(g.gateOpen && path.some((p) => p.s.x === gate.x && p.s.y < gate.h))) return null;
  }
  lv.solutions = sols.length;
  return lv;
}

/**
 * Keeps drawing until a level qualifies. After `stepMs` without success it asks `relax` for an easier
 * config (up to `maxStep` times), so generation always finishes.
 */
export function generate(
  cfg: GenConfig,
  seed: number,
  relax: (cfg: GenConfig, step: number) => GenConfig,
  { stepMs = 2200, maxStep = 4, now = () => performance.now() } = {},
): Level {
  const r = rng(seed);
  let step = 0;
  let cur = cfg;
  let since = now();
  for (;;) {
    const lv = attempt(r, cur);
    if (lv) return lv;
    if (now() - since > stepMs && step < maxStep) {
      step += 1;
      cur = relax(cfg, step);
      since = now();
    }
  }
}
