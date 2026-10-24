// How much the blocks still have to add before the hero can walk the whole way, counted on a relaxed walk, and whether
// the blocks left could add that much. A cheap test that never rules out a road: 逆築 uses it to skip terrains and
// half-built roads no block in the pool can finish, and drawing uses it to skip trays that cannot reach the goal,
// before either spends time on them.
//
// The walk only changes height on a slope (a stair or slide), by a jump off a clam, or by climbing a ladder or vine,
// and only stands on a flat top, a slope or inside an arch, ladder or vine. A block only adds cells, so the slopes,
// clams, ladders, vines and places to stand that the grid has not got yet can only come from the blocks still to go
// in, each in its own cells. So the relaxed walk may go anywhere the cells are free, and pays one for each change of
// height (`lift`) and each spot it stands on (`adds`) that nothing in the grid makes yet; no block can pay for more of
// those than `ADDS` says, so blocks that cannot add the cheapest walk's count cannot join the road however they go in.
import { walkable } from './path';
import { H } from './pieces';
import type { Grid, Level, PieceType, Pos } from './types';

export type Pool = Partial<Record<PieceType, number>>;

/**
 * The most one block can pay for on a relaxed walk: `lift`, changes of height (a slope one, a ladder or vine two, a clam
 * up to two each way); `adds`, those plus the spots it makes to stand on (a slope at either end and a stair's or
 * slide's flat top, an arch inside and on top, a stone bridge's three tops and its arch, a ladder's three, a clam's top
 * and the air it jumps through, a plain block one top per column in its widest orientation).
 */
const ADDS: Record<PieceType, { lift: number; adds: number }> = {
  cube: { lift: 0, adds: 1 },
  tower: { lift: 0, adds: 2 },
  bridge: { lift: 0, adds: 2 },
  long: { lift: 0, adds: 4 },
  stair: { lift: 1, adds: 4 },
  slide: { lift: 1, adds: 4 },
  ladder: { lift: 2, adds: 5 },
  spring: { lift: 4, adds: 5 },
  vine: { lift: 2, adds: 4 },
  bar: { lift: 0, adds: 3 },
  corner: { lift: 0, adds: 2 },
  parasol: { lift: 0, adds: 3 },
  wave: { lift: 0, adds: 3 },
};

/** Cells the hero can be in: its own and the other figures', an arch, a ladder, an open gate, a vine, on a slope */
const ROOM = new Set<string>(['char', 'arch', 'ladder', 'gateOpen', 'vine', 'stairR', 'stairL', 'slideR', 'slideL']);

/**
 * The least the blocks still to go in have to pay for on the cheapest relaxed walk: `lift` changes of height and
 * `adds` changes of height plus spots to stand on that the grid does not make yet. The stone gate counts as open and
 * the walk goes through it. Each leg of the walk (on to a star sand spot, on to the goal) counts on its own, as legs
 * can share blocks, so this is the dearest leg (in the better order of two stars).
 */
export function shortfall(g: Grid, lv: Level): { lift: number; adds: number } {
  const w = g.w;
  const R = H + 1;
  const gate = lv.gate;
  const cells = g.cells.slice();
  if (gate) for (let y = 0; y < gate.h; y++) cells[gate.x * H + y] = { k: 'gateOpen' };
  // Per column, a bit per height: where the hero can be, where it can stand now, and where it can go up a row now
  const room = new Uint8Array(w);
  const stand = new Uint8Array(w);
  const rise = new Uint8Array(w);
  for (let x = 0; x < w; x++)
    for (let y = g.water; y <= H; y++) {
      const c = y < H ? cells[x * H + y] : null;
      if (!c || ROOM.has(c.k)) room[x] |= 1 << y;
    }
  for (const s of walkable({ ...g, cells, gateOpen: true }).S) {
    stand[s.x] |= (1 << s.l) | (1 << s.r);
    if (s.ramp) rise[s.x] |= 1 << Math.min(s.l, s.r);
    // A clam sends the hero up to two rows, or catches it from as high, through the air above it
    if (s.spring) {
      rise[s.x] |= (1 << s.y) | (1 << (s.y + 1));
      stand[s.x] |= (1 << (s.y + 1)) | (1 << (s.y + 2));
    }
    if (s.ladder) rise[s.x] |= 1 << s.y;
    if (s.hang) rise[s.x] |= (1 << s.y) | (s.y > 0 ? 1 << (s.y - 1) : 0);
  }
  const at = (p: Pos) => p.x * R + p.y;
  /** Cheapest relaxed walk from `a` to `b`; `standing`: spots to stand on cost too */
  const cost = (a: Pos, b: Pos, standing: boolean): number => {
    const d = new Uint8Array(w * R).fill(255);
    let now = [at(a)];
    let next: number[] = [];
    d[at(a)] = 0;
    while (now.length) {
      const v = now.pop() as number;
      const x = Math.floor(v / R);
      const y = v % R;
      const step = (u: number, c: number) => {
        if (d[v] + c < d[u]) {
          d[u] = d[v] + c;
          (c ? next : now).push(u);
        }
      };
      if (x > 0 && (room[x - 1] >> y) & 1) step(v - R, standing && !((stand[x - 1] >> y) & 1) ? 1 : 0);
      if (x < w - 1 && (room[x + 1] >> y) & 1) step(v + R, standing && !((stand[x + 1] >> y) & 1) ? 1 : 0);
      if (y < H && (room[x] >> (y + 1)) & 1) step(v + 1, (rise[x] >> y) & 1 ? 0 : 1);
      if (y > 0 && (room[x] >> (y - 1)) & 1) step(v - 1, (rise[x] >> (y - 1)) & 1 ? 0 : 1);
      if (!now.length) [now, next] = [next, []];
    }
    return d[at(b)];
  };
  // Through the gate the two halves are one leg, so they add up
  const through = lv.stars.length ? null : gate;
  const orders = lv.stars.length === 2 ? [lv.stars, [lv.stars[1], lv.stars[0]]] : [lv.stars];
  const out = { lift: Number.POSITIVE_INFINITY, adds: Number.POSITIVE_INFINITY };
  for (const stars of orders) {
    const stops = through ? [lv.hero, { x: through.x, y: 0 }, lv.goal] : [lv.hero, ...stars, lv.goal];
    for (const key of ['lift', 'adds'] as const) {
      const legs: number[] = [];
      for (let i = 1; i < stops.length; i++) legs.push(cost(stops[i - 1], stops[i], key === 'adds'));
      const v = through ? legs.reduce((s, c) => s + c, 0) : Math.max(...legs);
      if (v < out[key]) out[key] = v;
    }
  }
  return out;
}

/** The most the best `k` blocks of the pool can pay for, counting the ones the stage must use in any case */
function canAdd(pool: Pool, must: readonly PieceType[], k: number): { lift: number; adds: number } {
  const rest = { ...pool };
  const out = { lift: 0, adds: 0 };
  for (const t of must) {
    out.lift += ADDS[t].lift;
    out.adds += ADDS[t].adds;
    rest[t] = (rest[t] ?? 0) - 1;
  }
  const blocks = (Object.keys(rest) as PieceType[]).flatMap((t) => Array<PieceType>(Math.max(0, rest[t] ?? 0)).fill(t));
  for (const key of ['lift', 'adds'] as const)
    out[key] += blocks
      .map((t) => ADDS[t][key])
      .sort((a, b) => b - a)
      .slice(0, Math.max(0, k - must.length))
      .reduce((s, v) => s + v, 0);
  return out;
}

/**
 * Whether `k` more blocks from the pool (`must` among them) could still join the road on this grid, as far as the
 * relaxed walk can tell. False means no way of placing them does; true is no promise. For the stone gate, a road that
 * does not go through it does not count, as the stage would turn it down anyway.
 */
export function couldJoin(g: Grid, lv: Level, pool: Pool, must: readonly PieceType[], k: number): boolean {
  const lack = shortfall(g, lv);
  const can = canAdd(pool, must, k);
  return lack.lift <= can.lift && lack.adds <= can.adds;
}
