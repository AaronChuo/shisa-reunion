// 逆築 (Backbuild): builds the answer first, then hides it. Given a drawn terrain and the blocks for the tray, it places
// the blocks one by one so the road grows towards the goal, and keeps the arrangement only if the very last block is
// what joins the road up. The blocks then go back into the tray, and the solver checks the level is fair exactly as
// it does for a level drawn at random. Building a road costs a handful of cheap walk-checks, where proving that a
// random draw has no road at all costs a full search; most random draws have none, so this is much faster.
import { makeGrid, placementsFor } from './grid';
import { edge, findRoute, type Walkable, walkable } from './path';
import { cellsOf, DEFS } from './pieces';
import type { GenConfig, Grid, Level, PathStep, Placement, Pos, Surface } from './types';

export type Rng = () => number;

const standsAt = (s: Surface, p: Pos) => !s.ramp && s.x === p.x && s.y === p.y;

/** Surfaces reachable from surface `start` (forward), or from which `start` can be reached (backward) */
function reach(g: Grid, S: Surface[], byCol: number[][], start: number, forward: boolean): number[] {
  const seen = new Uint8Array(S.length);
  seen[start] = 1;
  const out = [start];
  for (let q = 0; q < out.length; q++) {
    const i = out[q];
    const x = S[i].x;
    for (let cx = x - 1; cx <= x + 1; cx++) {
      if (cx < 0 || cx >= g.w) continue;
      for (const j of byCol[cx]) {
        if (seen[j]) continue;
        if (forward ? edge(g, S[i], S[j]) : edge(g, S[j], S[i])) {
          seen[j] = 1;
          out.push(j);
        }
      }
    }
  }
  return out;
}

/**
 * How far the road still is from done: for the goal and each star sand spot, the shortest step between where the
 * hero can get to and where that spot can be reached from. Zero for every target once they are all joined up.
 */
export function roadGap(g: Grid, lv: Level, ws: Walkable = walkable(g)): number {
  const { S, byCol } = ws;
  const hero = S.findIndex((s) => standsAt(s, lv.hero));
  if (hero < 0) return Number.POSITIVE_INFINITY;
  const from = reach(g, S, byCol, hero, true);
  let total = 0;
  for (const t of [...lv.stars, lv.goal]) {
    const ti = S.findIndex((s) => standsAt(s, t));
    if (ti < 0) return Number.POSITIVE_INFINITY;
    const to = reach(g, S, byCol, ti, false);
    let best = Number.POSITIVE_INFINITY;
    for (const i of from)
      for (const j of to) {
        const d = Math.abs(S[i].x - S[j].x) + Math.abs(S[i].y - S[j].y);
        if (d < best) best = d;
      }
    total += best;
  }
  return total;
}

/** Whether this walk is the kind the stage asks for: every required move, and through the stone gate if there is one */
export function walkFits(route: PathStep[], g: Grid, lv: Level, cfg: GenConfig): boolean {
  if (cfg.need.some((m) => !route.some((p) => p.via === m))) return false;
  const gate = lv.gate;
  return !gate || (g.gateOpen && route.some((p) => p.s.x === gate.x && p.s.y < gate.h));
}

const coversPlate = (p: Placement, lv: Level) => {
  const gate = lv.gate;
  if (!gate) return false;
  return cellsOf(p.t, p.o).some(([dx, dy]) => p.x + dx === gate.px && p.y + dy === gate.py);
};

/** Every placement of every orientation of a block on this grid */
function options(g: Grid, t: Placement['t']): Placement[] {
  const out: Placement[] = [];
  for (let o = 0; o < DEFS[t].orients.length; o++) out.push(...placementsFor(g, t, o));
  return out;
}

/** A built road: the blocks for the tray (sorted, as the tray shows them) and where each one goes */
export interface Build {
  inv: Placement['t'][];
  placed: Placement[];
}

/** At most this many spots are weighed for each block before the last one, so building stays cheap */
const SAMPLE = 36;

/**
 * Builds a road out of `cfg.k` blocks taken from the zone's pool (always including the blocks the stage must use),
 * placing them one by one so the road grows towards the goal and only the last block joins it up. The blocks used
 * become the tray. Null after `tries` attempts.
 */
export function backbuild(r: Rng, lv: Level, cfg: GenConfig, tries = 3): Build | null {
  const k = cfg.k;
  for (let attempt = 0; attempt < tries; attempt++) {
    const pool: Partial<Record<Placement['t'], number>> = { ...cfg.pool };
    const must = cfg.must.slice();
    const placed: Placement[] = [];
    let stuck = false;
    for (let n = 0; n < k && !stuck; n++) {
      const g = makeGrid(lv, placed);
      const left = k - n;
      // The blocks the stage must use come in before the tray runs out of room for them
      const types = (left <= must.length ? [...new Set(must)] : (Object.keys(pool) as Placement['t'][]).filter((t) => (pool[t] ?? 0) > 0)).filter(
        (t) => (pool[t] ?? 0) > 0,
      );
      let opts: Placement[] = types.flatMap((t) => options(g, t));
      // The stone gate only opens with a block on its plate: the first block goes there when one fits
      if (n === 0 && lv.gate) {
        const plate = opts.filter((p) => coversPlate(p, lv));
        if (plate.length) opts = plate;
      }
      let pick: Placement | null = null;
      if (n === k - 1) {
        // Last block: every spot of every block that may still go in, keeping one that joins the road up
        const done = opts.filter((p) => {
          const g2 = makeGrid(lv, [...placed, p]);
          const route = findRoute(g2, lv.hero, lv.goal, lv.stars);
          return !!route && walkFits(route, g2, lv, cfg);
        });
        if (done.length) pick = done[Math.floor(r() * done.length)];
      } else {
        // Earlier blocks: never finish the road early (the level would not need every block); among a sample of
        // spots, prefer those that bring it closest to done, with some chance so the roads differ
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        const scored: { p: Placement; gap: number }[] = [];
        for (const p of opts.slice(0, SAMPLE)) {
          const g2 = makeGrid(lv, [...placed, p]);
          const ws = walkable(g2);
          if (findRoute(g2, lv.hero, lv.goal, lv.stars, ws)) continue;
          scored.push({ p, gap: roadGap(g2, lv, ws) });
        }
        if (scored.length) {
          const best = Math.min(...scored.map((x) => x.gap));
          const near = scored.filter((x) => x.gap <= best + (r() < 0.35 ? 1 : 0));
          pick = near[Math.floor(r() * near.length)].p;
        }
      }
      if (!pick) {
        stuck = true;
        break;
      }
      placed.push(pick);
      pool[pick.t] = (pool[pick.t] ?? 0) - 1;
      const mi = must.indexOf(pick.t);
      if (mi >= 0) must.splice(mi, 1);
    }
    if (stuck || placed.length !== k || must.length) continue;
    // Taking any one block away must break the road; otherwise fewer blocks would do
    let needsAll = true;
    for (let i = 0; i < k && needsAll; i++) {
      const rest = placed.filter((_, j) => j !== i);
      if (findRoute(makeGrid(lv, rest), lv.hero, lv.goal, lv.stars)) needsAll = false;
    }
    if (!needsAll) continue;
    return { inv: placed.map((p) => p.t).sort(), placed };
  }
  return null;
}
