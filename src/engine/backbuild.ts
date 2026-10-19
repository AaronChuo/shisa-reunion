// 逆築 (Backbuild): builds the answer first, then hides it. Given a drawn terrain and the blocks for the tray, it places
// the blocks one by one so the road grows towards the goal, and keeps the arrangement only if the very last block is
// what joins the road up. The blocks then go back into the tray, and the solver checks the level is fair exactly as
// it does for a level drawn at random. Building a road costs a handful of cheap walk-checks, where proving that a
// random draw has no road at all costs a full search; most random draws have none, so this is much faster.
//
// A vine needs set-up that growing the road one block at a time never finds: it hangs under a block that juts out
// into the air, held up by a block beside it. So a stage with a vine starts from the vine: it picks where the vine will
// hang and builds what holds it (the jutting block, and a block under its other end if the ground has none there),
// then grows the rest of the road with the vine already standing in it, so the road is built to climb it. The vine
// goes in last.
//
// On wide ground most terrains cannot be joined with the stage's blocks at all, and growing a road one block at a time
// easily picks a block that leads nowhere. So 逆築 skips a terrain, or gives up on a half-built road, as soon as the
// blocks left cannot add the changes of height and spots to stand on the walk still lacks (`couldJoin`); picks, of the
// spots that bring the road closest, one that leaves the blocks enough to do; with two blocks to go, picks the second
// to last only once a last block is found to follow it; and on a stage with the stone gate starts each attempt from a
// different block on the plate.
import { at, fits, makeGrid, placementsFor, stable } from './grid';
import { edge, findRoute, type Walkable, walkable } from './path';
import { cellsOf, DEFS, H, HANG_FROM, SUPPORT, sizeOf } from './pieces';
import { couldJoin, type Pool } from './shortfall';
import type { GenConfig, Grid, Level, PathStep, PieceType, Placement, Pos, Surface } from './types';

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
function options(g: Grid, t: PieceType): Placement[] {
  const out: Placement[] = [];
  for (let o = 0; o < DEFS[t].orients.length; o++) out.push(...placementsFor(g, t, o));
  return out;
}

const inPool = (pool: Pool): PieceType[] => (Object.keys(pool) as PieceType[]).filter((t) => (pool[t] ?? 0) > 0);

function shuffle<T>(r: Rng, a: T[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

/** Rows 0..H of each column where the walkable spots in `set` are, as bits */
function rowsByCol(w: number, S: Surface[], set: number[]): Uint8Array {
  const m = new Uint8Array(w);
  for (const i of set) m[S[i].x] |= 1 << S[i].y;
  return m;
}

/** Whether any spot in `m` lies in columns x0..x1 and rows y0..y1 */
function within(m: Uint8Array, x0: number, x1: number, y0: number, y1: number): boolean {
  const rows = ((1 << (Math.min(y1, H) + 1)) - 1) & ~((1 << Math.max(y0, 0)) - 1);
  for (let x = Math.max(x0, 0); x <= Math.min(x1, m.length - 1); x++) if (m[x] & rows) return true;
  return false;
}

/**
 * A quick test that one more block could join the road on a grid where it is not joined yet. A block only adds
 * walkable spots in its own columns, from its bottom row to just above its top (and in the stone gate's column when it
 * opens the gate), and one move spans at most one column and two rows. So the block has to come that close both to
 * where the hero (or a star sand spot) can already get to and to where the goal (or a star sand spot) can already be
 * reached from. It only rules out blocks that cannot join the road, so the ones it keeps are checked in full as before.
 */
function mayJoin(g: Grid, lv: Level): (p: Placement) => boolean {
  const ws = walkable(g);
  if (findRoute(g, lv.hero, lv.goal, lv.stars, ws)) return () => true;
  const { S, byCol } = ws;
  const from: number[] = [];
  const to: number[] = [];
  const ends: [Pos, boolean, boolean][] = [[lv.hero, true, false], ...lv.stars.map((s): [Pos, boolean, boolean] => [s, true, true]), [lv.goal, false, true]];
  for (const [pos, fwd, bwd] of ends) {
    const i = S.findIndex((s) => standsAt(s, pos));
    if (i < 0) return () => false;
    if (fwd) from.push(...reach(g, S, byCol, i, true));
    if (bwd) to.push(...reach(g, S, byCol, i, false));
  }
  const F = rowsByCol(g.w, S, from);
  const T = rowsByCol(g.w, S, to);
  const gate = lv.gate && !g.gateOpen ? lv.gate : null;
  return (p) => {
    const { w, h } = sizeOf(p.t, p.o);
    const near = (m: Uint8Array) =>
      within(m, p.x - 1, p.x + w, p.y - 2, p.y + h + 2) || (!!gate && coversPlate(p, lv) && within(m, gate.x - 1, gate.x + 1, 0, gate.h + 2));
    return near(F) && near(T);
  };
}

/** A built road: the blocks for the tray (sorted, as the tray shows them) and where each one goes */
export interface Build {
  inv: PieceType[];
  placed: Placement[];
}

/** At most this many spots are weighed for each block before the last one (and set-ups for a vine), so building stays cheap */
const SAMPLE = 36;

/** A road being built: the blocks standing so far, the ones left to place, and a vine planned in from the start */
interface Work {
  placed: Placement[];
  pool: Pool;
  must: PieceType[];
  /** Stands in the road while the other blocks are placed, so they are placed to use it; it goes in last */
  vine: Placement | null;
}

function put(w: Work, p: Placement): void {
  w.placed.push(p);
  w.pool[p.t] = (w.pool[p.t] ?? 0) - 1;
  const mi = w.must.indexOf(p.t);
  if (mi >= 0) w.must.splice(mi, 1);
}

/** The blocks that may go in next: the ones the stage must use, once the tray has no room left for anything else */
const nextTypes = (w: Work, left: number): PieceType[] => (left <= w.must.length ? [...new Set(w.must)] : inPool(w.pool)).filter((t) => (w.pool[t] ?? 0) > 0);

/** The last block: every spot of every block that may still go in, keeping one that joins the road up */
function lastBlock(r: Rng, lv: Level, cfg: GenConfig, w: Work, ahead: Placement[]): Placement | null {
  const g = makeGrid(lv, [...w.placed, ...ahead]);
  const near = mayJoin(g, lv);
  const done = nextTypes(w, 1)
    .flatMap((t) => options(g, t))
    .filter((p) => {
      if (!near(p)) return false;
      const g2 = makeGrid(lv, [...w.placed, p, ...ahead]);
      const route = findRoute(g2, lv.hero, lv.goal, lv.stars);
      return !!route && walkFits(route, g2, lv, cfg);
    });
  return done.length ? done[Math.floor(r() * done.length)] : null;
}

/** Of the spots that bring the road closest, at most this many are checked for one that leaves the blocks enough to do */
const VIABLE = 3;
/** With two blocks to go, at most this many of the closest spots are tried, each with a full search for a last block */
const LOOKAHEAD = 4;

/**
 * Places blocks one by one until `total` stand, so the road grows towards the goal and only the last block joins it
 * up, in a walk that fits the stage. A planned vine stands in the road all along. False when a step finds no block, or
 * when the blocks left cannot finish the road.
 */
function grow(r: Rng, lv: Level, cfg: GenConfig, w: Work, total: number): boolean {
  const ahead = w.vine ? [w.vine] : [];
  // The road is walked once every block is in, with the tide as high as it gets by then
  const end = (placed: Placement[]) => makeGrid(lv, [...placed, ...ahead], total + ahead.length);
  const after = (p: Placement): Work => {
    const w2: Work = { placed: [...w.placed], pool: { ...w.pool }, must: w.must.slice(), vine: w.vine };
    put(w2, p);
    return w2;
  };
  while (w.placed.length < total) {
    const left = total - w.placed.length;
    if (!couldJoin(end(w.placed), lv, w.pool, w.must, left)) return false;
    let pick: Placement[] | null = null;
    if (left === 1) {
      const p = lastBlock(r, lv, cfg, w, ahead);
      if (p) pick = [p];
    } else {
      // Earlier blocks: never finish the road early (the level would not need every block); weigh a sample of spots
      // by how close each brings the road to done
      const g = makeGrid(lv, [...w.placed, ...ahead]);
      const opts = nextTypes(w, left).flatMap((t) => options(g, t));
      shuffle(r, opts);
      const scored: { p: Placement; gap: number }[] = [];
      for (const p of opts.slice(0, SAMPLE)) {
        const g2 = makeGrid(lv, [...w.placed, p, ...ahead]);
        const ws = walkable(g2);
        if (findRoute(g2, lv.hero, lv.goal, lv.stars, ws)) continue;
        scored.push({ p, gap: roadGap(g2, lv, ws) });
      }
      // Closest first, ties in random order, and now and then some a step further count as close, so the roads differ
      const slack = r() < 0.35;
      const order = scored
        .map((x) => ({ p: x.p, key: x.gap - (slack && r() < 0.5 ? 1 : 0) + r() * 0.5 }))
        .sort((a, b) => a.key - b.key)
        .map((x) => x.p);
      if (left === 2) {
        // The last two: the first spot a last block can follow
        for (const p of order.slice(0, LOOKAHEAD)) {
          const q = lastBlock(r, lv, cfg, after(p), ahead);
          if (q) {
            pick = [p, q];
            break;
          }
        }
      } else {
        // The first spot that leaves the blocks enough to do
        for (const p of order.slice(0, VIABLE)) {
          const w2 = after(p);
          if (couldJoin(end(w2.placed), lv, w2.pool, w2.must, left - 1)) {
            pick = [p];
            break;
          }
        }
      }
    }
    if (!pick) return false;
    for (const p of pick) put(w, p);
  }
  return true;
}

/** The blocks left once block `i` is taken away and whatever it held up falls: a vine hanging from it, a block on it */
function without(lv: Level, placed: readonly Placement[], i: number): Placement[] {
  let rest = placed.filter((_, j) => j !== i);
  for (;;) {
    const g = makeGrid(lv, rest);
    const held = rest.filter((p) => stable(g, p.t, p.o, p.x, p.y));
    if (held.length === rest.length) return rest;
    rest = held;
  }
}

/**
 * Whether taking any one block away breaks the road; otherwise fewer blocks would do. What the block held up falls
 * with it, so a block that holds up a vine or another block counts as part of the road.
 */
function needsAll(lv: Level, placed: readonly Placement[]): boolean {
  for (let i = 0; i < placed.length; i++) if (findRoute(makeGrid(lv, without(lv, placed, i)), lv.hero, lv.goal, lv.stars)) return false;
  return true;
}

/** Whether a block let go at (x, y) comes to rest right there and stands: the rule placementsFor lists spots by */
const restsAt = (g: Grid, t: PieceType, o: number, x: number, y: number) => fits(g, t, o, x, y) && !(y > 0 && fits(g, t, o, x, y - 1)) && stable(g, t, o, x, y);

/** Spots of the pool's blocks that put a flat underside at (x, y), over the vine's top, for the vine to hang from */
function hangers(g: Grid, x: number, y: number, pool: Pool): Placement[] {
  const out: Placement[] = [];
  for (const t of inPool(pool)) {
    if (t === 'vine') continue;
    for (let o = 0; o < DEFS[t].orients.length; o++)
      for (const [dx, dy, k] of cellsOf(t, o)) if (HANG_FROM.has(k) && restsAt(g, t, o, x - dx, y - dy)) out.push({ t, o, x: x - dx, y: y - dy });
  }
  return out;
}

/** Spots of the pool's blocks that give a hanger at (x, y) something to rest its other end on: a flat top beside it */
function holders(g: Grid, x: number, y: number, pool: Pool): Placement[] {
  const sides = [x - 1, x + 1].filter((sx) => sx >= 0 && sx < g.w && !at(g, sx, y) && !SUPPORT.has(at(g, sx, y - 1)?.k ?? ''));
  const out: Placement[] = [];
  for (const t of inPool(pool)) {
    if (t === 'vine') continue;
    for (let o = 0; o < DEFS[t].orients.length; o++) {
      const cells = cellsOf(t, o);
      for (const sx of sides)
        for (const [dx, dy, k] of cells) {
          const p: Placement = { t, o, x: sx - dx, y: y - 1 - dy };
          // It has to leave free both cells the hanger goes in
          const on = (cx: number, cy: number) => cells.some(([ex, ey]) => p.x + ex === cx && p.y + ey === cy);
          if (!SUPPORT.has(k) || on(x, y) || on(sx, y) || !restsAt(g, t, o, p.x, p.y)) continue;
          if (!out.some((q) => q.t === t && q.o === o && q.x === p.x && q.y === p.y)) out.push(p);
        }
    }
  }
  return out;
}

/** Where a vine will hang, and the blocks that hold it up, in the order they go in (the vine itself goes in last) */
export interface VinePlan {
  vine: Placement;
  blocks: Placement[];
}

/** Every way to set up a spot for a vine on this terrain with at most two of the pool's blocks */
export function vinePlans(lv: Level, pool: Pool): VinePlan[] {
  const g = makeGrid(lv, []);
  const out: VinePlan[] = [];
  for (let x = 0; x < lv.w; x++) {
    for (let y = 0; y + 2 < H; y++) {
      if (!fits(g, 'vine', 0, x, y)) continue;
      const vine: Placement = { t: 'vine', o: 0, x, y };
      const above = at(g, x, y + 2);
      if (above) {
        // The ground already juts out over this spot
        if (HANG_FROM.has(above.k)) out.push({ vine, blocks: [] });
        continue;
      }
      // With the vine standing, nothing can drop into its cells, so a hanger has to rest on its other end
      const gv = makeGrid(lv, [vine]);
      for (const a of hangers(gv, x, y + 2, pool)) out.push({ vine, blocks: [a] });
      for (const s of holders(gv, x, y + 2, pool)) {
        const rest = { ...pool, [s.t]: (pool[s.t] ?? 0) - 1 };
        // ...only hangers that rest on the holder: one that stands without it needs no holder
        for (const a of hangers(makeGrid(lv, [s, vine]), x, y + 2, rest)) if (!stable(gv, a.t, a.o, a.x, a.y)) out.push({ vine, blocks: [s, a] });
      }
    }
  }
  return out;
}

/**
 * A stage with a vine: ranks the ways to set the vine up by how close each brings the road to done (now and then
 * counting one a step closer than it is, so the roads differ), then, for the best `tries` of them, builds the set-up
 * and grows the rest of the road with the vine standing in it. The vine goes in last.
 */
function buildAroundVine(r: Rng, lv: Level, cfg: GenConfig, tries: number): Placement[] | null {
  const real = cfg.k - 1;
  const pool: Pool = { ...cfg.pool, vine: (cfg.pool.vine ?? 0) - 1 };
  const must = cfg.must.slice();
  must.splice(must.indexOf('vine'), 1);
  const plans = vinePlans(lv, pool).filter((pl) => {
    if (pl.blocks.length > real) return false;
    // ...leaving room for the other blocks the stage must use
    const m = must.slice();
    for (const b of pl.blocks) if (m.includes(b.t)) m.splice(m.indexOf(b.t), 1);
    return m.length <= real - pl.blocks.length;
  });
  shuffle(r, plans);
  const ranked: { pl: VinePlan; gap: number }[] = [];
  for (const pl of plans.slice(0, SAMPLE)) {
    const g = makeGrid(lv, [...pl.blocks, pl.vine]);
    const ws = walkable(g);
    const route = findRoute(g, lv.hero, lv.goal, lv.stars, ws);
    // A set-up that uses up the tray has to join the road itself; any other must leave it open for the last block
    if (pl.blocks.length === real) {
      if (route && walkFits(route, g, lv, cfg)) ranked.push({ pl, gap: 0 });
    } else if (!route) ranked.push({ pl, gap: roadGap(g, lv, ws) - (r() < 0.35 ? 1 : 0) });
  }
  ranked.sort((a, b) => a.gap - b.gap);
  for (const { pl } of ranked.slice(0, tries)) {
    const w: Work = { placed: [], pool: { ...pool }, must: must.slice(), vine: pl.vine };
    for (const b of pl.blocks) put(w, b);
    if (!grow(r, lv, cfg, w, real) || w.must.length) continue;
    const placed = [...w.placed, pl.vine];
    if (needsAll(lv, placed)) return placed;
  }
  return null;
}

/**
 * Builds a road out of `cfg.k` blocks taken from the zone's pool (always including the blocks the stage must use),
 * placing them one by one so the road grows towards the goal and only the last block joins it up. A stage with a vine
 * is built around the vine, each attempt from the next-best way to set it up; a stage with the stone gate starts each
 * attempt from a different block on its plate, as the gate only opens with one there. The blocks used become the tray.
 * Null at once when the pool cannot join the road on this terrain, otherwise after `tries` attempts.
 */
export function backbuild(r: Rng, lv: Level, cfg: GenConfig, tries = 3): Build | null {
  if (!couldJoin(makeGrid(lv, [], cfg.k), lv, cfg.pool, cfg.must, cfg.k)) return null;
  if (cfg.must.includes('vine')) {
    const placed = buildAroundVine(r, lv, cfg, tries);
    return placed && { inv: placed.map((p) => p.t).sort(), placed };
  }
  const plates: Placement[] = [];
  if (lv.gate) {
    const g = makeGrid(lv, []);
    for (const t of cfg.k <= cfg.must.length ? new Set(cfg.must) : inPool(cfg.pool)) plates.push(...options(g, t).filter((p) => coversPlate(p, lv)));
    shuffle(r, plates);
  }
  for (let attempt = 0; attempt < (plates.length ? Math.min(tries, plates.length) : tries); attempt++) {
    const w: Work = { placed: [], pool: { ...cfg.pool }, must: cfg.must.slice(), vine: null };
    if (plates.length) put(w, plates[attempt]);
    if (!grow(r, lv, cfg, w, cfg.k) || w.must.length || !needsAll(lv, w.placed)) continue;
    return { inv: w.placed.map((p) => p.t).sort(), placed: w.placed };
  }
  return null;
}
