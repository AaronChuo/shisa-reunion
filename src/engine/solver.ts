import { makeGrid, placementsFor, waterAt } from './grid';
import { edge, findRoute, type Walkable, walkable } from './path';
import { DEFS, shapeOf } from './pieces';
import type { Grid, Level, PieceType, Placement, Surface } from './types';

export const placeKey = (p: Placement): string => `${p.t}${p.o}@${p.x},${p.y}`;

const TYPES = Object.keys(DEFS) as PieceType[];
const TYPE_NO = Object.fromEntries(TYPES.map((t, i) => [t, i])) as Record<PieceType, number>;
/** A placement as one small number (type, orientation, x up to 31, y up to 7), so visited sets are cheap to key */
const placeCode = (p: Placement): number => ((TYPE_NO[p.t] * 4 + p.o) * 32 + p.x) * 8 + p.y;
/** The same set of placements in any order gives the same key: one character per placement, so keys stay short */
const setKey = (placed: readonly Placement[]): string => String.fromCharCode(...placed.map(placeCode).sort((a, b) => a - b));

/** How many columns each orientation of a piece covers, counted from its left one (the cells sit in neighbouring columns) */
const SPAN = Object.fromEntries(TYPES.map((t) => [t, DEFS[t].orients.map((_, o) => shapeOf(t, o).w)])) as Record<PieceType, number[]>;
/** The most columns one piece of each type can cover */
const WIDTH = Object.fromEntries(TYPES.map((t) => [t, Math.max(...SPAN[t])])) as Record<PieceType, number>;

/** More columns than any board has: "no number of blocks can do it" */
const NEVER = 255;

/** Where the walk gets to from one figure or star (or what gets to it) without any change */
interface Spread {
  /** Columns it reaches: a surface in them, or their wildcard when that is free */
  cols: number;
  /** Each surface it reaches, then each column's wildcard */
  got: Uint8Array;
}

/** Cheapest costs, with every column but the free ones costing one, per column: to a surface in it, and to its wildcard */
interface Reach {
  near: Uint8Array;
  wild: Uint8Array;
}

/** Those costs from each start of a leg of the walk, to each end, and for each whole leg */
interface Table {
  from: Reach[];
  to: Reach[];
  base: number[];
}

const NOWHERE: Spread = { cols: 0, got: new Uint8Array(0) };

/**
 * Relevance pruning: which blocks, where, could still lead to a win from the current arrangement.
 *
 * Everything the walk depends on is local to a column. A column's walkable surfaces come from that column's cells only
 * (plus the water, which only rises, and the sea urchins, which never move), and whether a character can step between
 * two neighbouring surfaces depends only on those two surfaces and the headroom in one of their two columns. Blocks
 * are only ever added during the search, so from a given arrangement, further blocks can change only the columns they
 * cover, plus the stone gate's column if one of them lands on the plate; everything else stays exactly as it is now,
 * except that rising water can only take surfaces away. Every block covers one run of neighbouring columns.
 *
 * So the bound takes the walk graph of the current arrangement and lets a changed column be a "wildcard" that joins
 * everything in it and next to it. The walk (hero to goal, and to and from each star) has to work with only the
 * columns the remaining blocks could change as wildcards; when it can't, no arrangement below this one can win, and
 * the search skips it. With one or two blocks left that means one or two runs of columns, each as wide as its block;
 * with more, the walk has to need no more wildcard columns than the blocks can cover between them. Skipping only
 * arrangements that can never lead to a win leaves every other step of the search, and so every solution and the
 * order they are found in, exactly as before.
 *
 * Each check has two variants: with the stone gate as it is (0), and opened by a block on the plate (1), when the
 * gate's and the plate's columns are wildcards too.
 *
 * This leans on the walking rules in `path.ts` staying local to a column (and to the step between two neighbouring
 * columns). `solver.slow.test.ts` holds the search to the one before pruning (`solver.reference.ts`) on many levels, so a
 * rule change that breaks that shows up there.
 */
class Bound {
  private readonly w: number;
  private readonly n: number;
  private readonly S: Surface[];
  /** Surfaces still above the water once the next block is down, by column (indices into S) */
  private readonly byCol: number[][];
  /** The hero, the goal, then each star: the surface it stands on (-1 when none) and its column */
  private readonly at: number[];
  private readonly ex: number[];
  /** Pairs of the above the walk joins: hero to goal, hero to each star, each star to goal */
  private readonly legs: [number, number][] = [[0, 1]];
  /** The hero, the goal or a star is under water from the next block on: nothing can help any more */
  private readonly flooded: boolean;
  /** The stone gate is shut, so a block on its plate would open it */
  private readonly shut: boolean;
  private readonly plateX: number;
  /** Wildcard columns that cost nothing, per variant */
  private readonly free: [number, number];
  private out: number[][] | null = null;
  private inn: number[][] = [];
  private readonly spreads: (Spread[] | undefined)[] = [undefined, undefined];
  private readonly tables: (Table | undefined)[] = [undefined, undefined];
  private readonly memo = new Map<number, number>();
  private readonly joined: (Int8Array | undefined)[] = [undefined, undefined];

  constructor(
    lv: Level,
    private readonly g: Grid,
    ws: Walkable,
    water: number,
  ) {
    const w = g.w;
    this.w = w;
    this.S = ws.S;
    this.n = ws.S.length;
    this.byCol = ws.byCol.map((col) => col.filter((i) => ws.S[i].y >= water));
    const ends = [lv.hero, lv.goal, ...lv.stars];
    this.ex = ends.map((p) => p.x);
    this.at = ends.map((p) => ws.S.findIndex((s) => !s.ramp && s.x === p.x && s.y === p.y));
    lv.stars.forEach((_, i) => {
      this.legs.push([0, 2 + i], [2 + i, 1]);
    });
    this.flooded = ends.some((p) => p.y < water);
    const gate = lv.gate;
    this.shut = !!gate && !g.gateOpen;
    this.plateX = gate?.px ?? -1;
    this.free = [0, gate && this.shut ? (1 << gate.x) | (1 << gate.px) : 0];
  }

  /** Columns a..b and the one on each side, as a bit mask */
  private around(a: number, b: number): number {
    const lo = Math.max(0, a - 1);
    const hi = Math.min(this.w - 1, b + 1);
    return ((1 << (hi + 1)) - 1) & ~((1 << lo) - 1);
  }

  private plateIn(a: number, b: number): boolean {
    return this.shut && a <= this.plateX && this.plateX <= b;
  }

  /** The walk graph's steps, worked out the first time something needs all of them */
  private build(): void {
    const { S, byCol, w, g } = this;
    const out: number[][] = Array.from({ length: this.n }, () => []);
    const inn: number[][] = Array.from({ length: this.n }, () => []);
    for (let x = 0; x < w; x++) {
      for (const a of byCol[x]) {
        for (let cx = Math.max(0, x - 1); cx <= Math.min(w - 1, x + 1); cx++) {
          for (const b of byCol[cx]) {
            if (b !== a && edge(g, S[a], S[b])) {
              out[a].push(b);
              inn[b].push(a);
            }
          }
        }
      }
    }
    this.out = out;
    this.inn = inn;
  }

  /**
   * Everything the walk gets to from the given surfaces and wildcard columns (or that gets to them, going backwards)
   * with no change but the `free` wildcard columns
   */
  private walk(forward: boolean, from: readonly number[], cols: number, free: number): Spread {
    const { n, w, S, byCol, g } = this;
    const got = new Uint8Array(n + w);
    const q: number[] = [];
    let mask = 0;
    const steps = this.out ? (forward ? this.out : this.inn) : null;
    const open = (c: number) => {
      // A wildcard column joins everything in it and next to it, and the free wildcards next to it
      if (got[n + c]) return;
      got[n + c] = 1;
      mask |= 1 << c;
      for (let cx = Math.max(0, c - 1); cx <= Math.min(w - 1, c + 1); cx++) {
        for (const u of byCol[cx]) {
          if (!got[u]) {
            got[u] = 1;
            q.push(u);
          }
        }
        if ((free >> cx) & 1) open(cx);
      }
    };
    for (const s of from) {
      if (!got[s]) {
        got[s] = 1;
        q.push(s);
      }
    }
    for (let c = 0; c < w; c++) if ((cols >> c) & 1) open(c);
    for (let i = 0; i < q.length; i++) {
      const v = q[i];
      const sv = S[v];
      mask |= 1 << sv.x;
      if (steps) {
        for (const u of steps[v]) {
          if (!got[u]) {
            got[u] = 1;
            q.push(u);
          }
        }
      }
      for (let cx = Math.max(0, sv.x - 1); cx <= Math.min(w - 1, sv.x + 1); cx++) {
        if (!steps) {
          for (const u of byCol[cx]) {
            if (!got[u] && (forward ? edge(g, sv, S[u]) : edge(g, S[u], sv))) {
              got[u] = 1;
              q.push(u);
            }
          }
        }
        if ((free >> cx) & 1) open(cx);
      }
    }
    return { cols: mask, got };
  }

  /** Where the walk gets to from each start of a leg, and what gets to each end, with no change */
  private spread(variant: number): Spread[] {
    const known = this.spreads[variant];
    if (known) return known;
    const free = this.free[variant];
    const row: Spread[] = [];
    for (let e = 0; e < this.at.length; e++) {
      const from = this.at[e] >= 0 ? [this.at[e]] : [];
      const cols = free & (1 << this.ex[e]);
      // The hero only ever starts a leg and the goal only ever ends one; stars do both
      row[2 * e] = e === 1 ? NOWHERE : this.walk(true, from, cols, free);
      row[2 * e + 1] = e === 0 ? NOWHERE : this.walk(false, from, cols, free);
    }
    this.spreads[variant] = row;
    return row;
  }

  private reached(sp: Spread, e: number): boolean {
    return (this.at[e] >= 0 && sp.got[this.at[e]] === 1) || sp.got[this.n + this.ex[e]] === 1;
  }

  /** Whether the spread touches the wildcard run a..b (whose surroundings are `near`), or starts inside it */
  private touches(sp: Spread, e: number, a: number, b: number, near: number): boolean {
    return (a <= this.ex[e] && this.ex[e] <= b) || (sp.cols & near) !== 0;
  }

  /** Whether every leg of the walk works with no change but the run of columns a..b */
  private joins(a: number, b: number, variant: number): boolean {
    let memo = this.joined[variant];
    if (!memo) {
      memo = new Int8Array(this.w * this.w).fill(-1);
      this.joined[variant] = memo;
    }
    const known = memo[a * this.w + b];
    if (known >= 0) return known === 1;
    const sp = this.spread(variant);
    const near = this.around(a, b);
    let ok = true;
    for (const [s, e] of this.legs) {
      if (this.reached(sp[2 * s], e)) continue;
      if (!this.touches(sp[2 * s], s, a, b, near) || !this.touches(sp[2 * e + 1], e, a, b, near)) {
        ok = false;
        break;
      }
    }
    memo[a * this.w + b] = ok ? 1 : 0;
    return ok;
  }

  /**
   * Whether some run of `sA` columns starting at a column in the bit mask `startsA`, and some run of `sB` starting in
   * `startsB`, between them make every leg of the walk work with no other change
   */
  private pair(sA: number, startsA: number, sB: number, startsB: number, variant: number): boolean {
    if (!startsA || !startsB) return false;
    const runs = (m: number, s: number) => {
      const out: number[] = [];
      for (let a = 0; a + s <= this.w; a++) if ((m >> a) & 1) out.push(a);
      return out;
    };
    const as = runs(startsA, sA);
    const bs = runs(startsB, sB);
    if (this.legs.length > 1) {
      // With stars every leg has to work with the same two runs: try them all
      for (const a of as) for (const b of bs) if (this.joinsTwo(a, a + sA - 1, b, b + sB - 1, variant)) return true;
      return false;
    }
    const sp = this.spread(variant);
    if (this.reached(sp[0], 1)) return true;
    // One run on its own, or two side by side as one
    for (const a of as) if (this.joins(a, a + sA - 1, variant)) return true;
    for (const b of bs) if (this.joins(b, b + sB - 1, variant)) return true;
    for (const a of as) {
      for (const b of bs) {
        if (b <= a + sA && a <= b + sB && this.joins(Math.min(a, b), Math.max(a + sA, b + sB) - 1, variant)) return true;
      }
    }
    // Into one run, on to the other (which only has to be next to somewhere the first leads), and out of it
    const cross = (from: number[], sF: number, to: number[], sT: number) => {
      let cover = 0;
      for (const b of to) if (this.touches(sp[3], 1, b, b + sT - 1, this.around(b, b + sT - 1))) cover |= this.around(b, b + sT - 1);
      if (!cover) return false;
      for (const a of from)
        if (this.touches(sp[0], 0, a, a + sF - 1, this.around(a, a + sF - 1)) && (this.reachOf(a, a + sF - 1, variant) & cover) !== 0) return true;
      return false;
    };
    return cross(as, sA, bs, sB) || cross(bs, sB, as, sA);
  }

  /** Bit mask of the columns a run of `span` columns can start at, all of them or only those covering the plate */
  private startsFor(span: number, onPlate: boolean): number {
    let m = 0;
    for (let a = 0; a + span <= this.w; a++) if (!onPlate || (a <= this.plateX && this.plateX < a + span)) m |= 1 << a;
    return m;
  }

  /** Columns the walk gets to from the wildcard run a..b with no other change */
  private reachOf(a: number, b: number, variant: number): number {
    const key = ((variant * 32 + a) * 32 + b) * 4 + 3;
    const known = this.memo.get(key);
    if (known !== undefined) return known;
    const from: number[] = [];
    for (let c = Math.max(0, a - 1); c <= Math.min(this.w - 1, b + 1); c++) from.push(...this.byCol[c]);
    const free = this.free[variant];
    const m = this.walk(true, from, free & this.around(a, b), free).cols;
    this.memo.set(key, m);
    return m;
  }

  /** Whether every leg of the walk works with no change but the two runs of columns a1..b1 and a2..b2 */
  private joinsTwo(a1: number, b1: number, a2: number, b2: number, variant: number): boolean {
    // Runs side by side make one run
    if (a2 <= b1 + 1 && a1 <= b2 + 1) return this.joins(Math.min(a1, a2), Math.max(b1, b2), variant);
    const sp = this.spread(variant);
    const n1 = this.around(a1, b1);
    const n2 = this.around(a2, b2);
    for (const [s, e] of this.legs) {
      const from = sp[2 * s];
      const to = sp[2 * e + 1];
      if (this.reached(from, e)) continue;
      const in1 = this.touches(from, s, a1, b1, n1);
      const in2 = this.touches(from, s, a2, b2, n2);
      const out1 = this.touches(to, e, a1, b1, n1);
      const out2 = this.touches(to, e, a2, b2, n2);
      if ((in1 && out1) || (in2 && out2)) continue;
      // Into one run, on from it to the other, and out of that one
      if (in1 && out2 && (this.reachOf(a1, b1, variant) & n2) !== 0) continue;
      if (in2 && out1 && (this.reachOf(a2, b2, variant) & n1) !== 0) continue;
      return false;
    }
    return true;
  }

  /** Cheapest costs from leg end `e` (or to it, going backwards), every column but the free ones costing one */
  private costs(forward: boolean, e: number, free: number): { dist: Uint8Array; reach: Reach } {
    if (!this.out) this.build();
    const { n, w, S, byCol } = this;
    const steps = forward ? (this.out as number[][]) : this.inn;
    const dist = new Uint8Array(n + w).fill(NEVER);
    let cur: number[] = [];
    let nxt: number[] = [];
    const s = this.at[e];
    if (s >= 0) {
      dist[s] = 0;
      cur.push(s);
    }
    const x0 = this.ex[e];
    const c0 = (free >> x0) & 1 ? 0 : 1;
    dist[n + x0] = c0;
    (c0 ? nxt : cur).push(n + x0);
    for (let d = 0; cur.length || nxt.length; d++) {
      for (let i = 0; i < cur.length; i++) {
        const v = cur[i];
        if (dist[v] !== d) continue;
        const wildcard = v >= n;
        const vx = wildcard ? v - n : S[v].x;
        if (!wildcard) {
          for (const u of steps[v]) {
            if (dist[u] > d) {
              dist[u] = d;
              cur.push(u);
            }
          }
        }
        for (let cx = Math.max(0, vx - 1); cx <= Math.min(w - 1, vx + 1); cx++) {
          if (wildcard) {
            for (const u of byCol[cx]) {
              if (dist[u] > d) {
                dist[u] = d;
                cur.push(u);
              }
            }
            if (cx === vx) continue;
          }
          const nd = (free >> cx) & 1 ? d : d + 1;
          if (nd < dist[n + cx]) {
            dist[n + cx] = nd;
            (nd === d ? cur : nxt).push(n + cx);
          }
        }
      }
      cur = nxt;
      nxt = [];
    }
    const near = new Uint8Array(w).fill(NEVER);
    for (let x = 0; x < w; x++) for (const v of byCol[x]) if (dist[v] < near[x]) near[x] = dist[v];
    return { dist, reach: { near, wild: dist.subarray(n) } };
  }

  private table(variant: number): Table {
    const known = this.tables[variant];
    if (known) return known;
    const free = this.free[variant];
    const from: Reach[] = [];
    const to: Reach[] = [];
    const fromDist: Uint8Array[] = [];
    for (let e = 0; e < this.at.length; e++) {
      if (e !== 1) {
        const { dist, reach } = this.costs(true, e, free);
        from[e] = reach;
        fromDist[e] = dist;
      }
      if (e !== 0) to[e] = this.costs(false, e, free).reach;
    }
    const base = this.legs.map(([a, b]) => Math.min(this.at[b] >= 0 ? fromDist[a][this.at[b]] : NEVER, fromDist[a][this.n + this.ex[b]]));
    const t = { from, to, base };
    this.tables[variant] = t;
    return t;
  }

  /** Cheapest cost into the wildcard run a..b from the start (or out of it to the end) */
  private touch(r: Reach, x: number, a: number, b: number): number {
    if (a <= x && x <= b) return 0;
    let m = NEVER;
    for (let c = Math.max(0, a - 1); c <= Math.min(this.w - 1, b + 1); c++) if (r.near[c] < m) m = r.near[c];
    if (a > 0 && r.wild[a - 1] < m) m = r.wild[a - 1];
    if (b < this.w - 1 && r.wild[b + 1] < m) m = r.wild[b + 1];
    return m;
  }

  /**
   * Fewest columns, besides the run a..b (none when a > b), that must change for the whole walk to work. A walk
   * through the run is the cheapest way into it plus the cheapest way out of it, since it joins everything around it.
   */
  private need(a: number, b: number, variant: number): number {
    const t = this.table(variant);
    let worst = 0;
    for (let l = 0; l < this.legs.length && worst < NEVER; l++) {
      let c = t.base[l];
      if (c > 0 && a <= b) {
        const [s, e] = this.legs[l];
        const into = this.touch(t.from[s], this.ex[s], a, b);
        if (into < c) c = Math.min(c, into + this.touch(t.to[e], this.ex[e], a, b));
      }
      if (c > worst) worst = c;
    }
    return worst;
  }

  /** Whether blocks covering at most `budget` columns, besides a..b (`onPlate`: which lands on the plate), could make the walk work */
  private enough(a: number, b: number, onPlate: boolean, budget: number): boolean {
    if (!this.shut) return this.need(a, b, 0) <= budget;
    if (onPlate) return this.need(a, b, 1) <= budget;
    // A later block may open the gate, which costs that block the plate's column
    return this.need(a, b, 0) <= budget || this.need(a, b, 1) + (a <= this.plateX && this.plateX <= b ? 0 : 1) <= budget;
  }

  /** Whether a block over a..b and then a last block covering a run of `span` columns could make the walk work */
  private canFinish(a: number, b: number, span: number, onPlate: boolean): boolean {
    const key = ((span * 32 + a) * 32 + b) * 4 + (onPlate ? 1 : 0);
    const known = this.memo.get(key);
    if (known !== undefined) return known === 1;
    const s = b - a + 1;
    const any = this.startsFor(span, false);
    // On the plate the gate opens; otherwise it stays shut unless the last block lands on the plate
    const ok =
      this.shut && onPlate
        ? this.pair(s, 1 << a, span, any, 1)
        : this.pair(s, 1 << a, span, any, 0) || (this.shut && this.pair(s, 1 << a, span, this.startsFor(span, true), 1));
    this.memo.set(key, ok ? 1 : 0);
    return ok;
  }

  /** Whether the blocks in `left` could still lead to a win from here at all, before trying where each one goes */
  hopeful(left: readonly PieceType[]): boolean {
    if (this.flooded) return false;
    const w = this.w;
    if (left.length === 1) {
      const span = WIDTH[left[0]];
      for (let a = 0; a + span <= w; a++) {
        const b = a + span - 1;
        if (this.joins(a, b, 0) || (this.plateIn(a, b) && this.joins(a, b, 1))) return true;
      }
      return false;
    }
    if (left.length === 2) {
      const [s1, s2] = [WIDTH[left[0]], WIDTH[left[1]]];
      const [any1, any2] = [this.startsFor(s1, false), this.startsFor(s2, false)];
      return (
        this.pair(s1, any1, s2, any2, 0) ||
        (this.shut && (this.pair(s1, this.startsFor(s1, true), s2, any2, 1) || this.pair(s1, any1, s2, this.startsFor(s2, true), 1)))
      );
    }
    const budget = left.reduce((s, t) => s + WIDTH[t], 0);
    return this.need(1, 0, 0) <= budget || (this.shut && this.need(1, 0, 1) + 1 <= budget);
  }

  /**
   * What a block over columns a..b (`onPlate`: on the plate too) can still do, with the blocks in `rest` left after it:
   * 0 nothing, so it is skipped; 1 perhaps lead to a win later; 2 perhaps win at once
   */
  fate(a: number, b: number, onPlate: boolean, rest: readonly PieceType[]): 0 | 1 | 2 {
    if (this.flooded) return 0;
    if (this.joins(a, b, this.shut && onPlate ? 1 : 0)) return 2;
    if (!rest.length) return 0;
    if (rest.length === 1) return this.canFinish(a, b, WIDTH[rest[0]], onPlate) ? 1 : 0;
    const budget = rest.reduce((s, t) => s + WIDTH[t], 0);
    return this.enough(a, b, onPlate, budget) ? 1 : 0;
  }
}

/** Calls `win` for each new winning arrangement and `enter` for each new arrangement looked at; either ends the search by returning false */
interface Visit {
  enter(): boolean;
  win(placed: readonly Placement[]): boolean;
}

/**
 * Depth-first over build orders, each set of blocks looked at once whatever order it was built in; a branch stops as
 * soon as it wins. Blocks that cannot lead to a win (see `Bound`) are skipped without being looked at, which leaves
 * the order the rest are looked at in, and so the solutions and their order, exactly as without the skipping.
 */
function search(lv: Level, visit: Visit): void {
  const seen = new Set<string>();
  let done = false;
  const gate = lv.gate;
  const onPlate = (p: Placement) => !!gate && DEFS[p.t].orients[p.o].some(([dx, dy]) => p.x + dx === gate.px && p.y + dy === gate.py);
  const plateIn = (a: number, b: number) => !!gate && a <= gate.px && gate.px <= b;
  /** `chance`: whether this arrangement itself might win, false when the bound already rules that out */
  function dfs(placed: Placement[], left: PieceType[], chance: boolean) {
    const key = setKey(placed);
    if (seen.has(key)) return;
    seen.add(key);
    if (!visit.enter()) {
      done = true;
      return;
    }
    const g = makeGrid(lv, placed);
    const ws = walkable(g);
    if (chance && findRoute(g, lv.hero, lv.goal, lv.stars, ws)) {
      if (!visit.win(placed)) done = true;
      return;
    }
    if (!left.length) return;
    const bound = new Bound(lv, g, ws, waterAt(lv, placed.length + 1));
    if (!bound.hopeful(left)) return;
    for (const t of new Set(left)) {
      const rest = left.slice();
      rest.splice(rest.indexOf(t), 1);
      for (let o = 0; o < DEFS[t].orients.length; o++) {
        const span = SPAN[t][o];
        // What a block of this type and orientation can do, by column and whether it lands on the plate
        const fates = new Int8Array(2 * g.w).fill(-1);
        const fate = (x: number, plate: boolean) => {
          const i = 2 * x + (plate ? 1 : 0);
          if (fates[i] < 0) fates[i] = bound.fate(x, x + span - 1, plate, rest);
          return fates[i];
        };
        // Columns where it cannot help are not even tried
        const keep = (x: number) => fate(x, false) > 0 || (plateIn(x, x + span - 1) && fate(x, true) > 0);
        for (const pl of placementsFor(g, t, o, keep)) {
          const f = fate(pl.x, onPlate(pl));
          if (!f) continue;
          placed.push(pl);
          dfs(placed, rest, f === 2);
          placed.pop();
          if (done) return;
        }
      }
    }
  }
  dfs([], lv.inv.slice(), true);
}

/**
 * All winning arrangements reachable from the start, in placement order; a branch stops as soon as it wins.
 * With `minLen`, the search stops early (and says `short`) the moment it finds a win using fewer pieces than that:
 * such a level is rejected anyway, so there is no need to finish the search. `nodes` counts the arrangements looked at.
 */
export function solve(lv: Level, cap = 400, { minLen = 0 }: { minLen?: number } = {}): { sols: Placement[][]; nodes: number; short: boolean } {
  const sols: Placement[][] = [];
  let nodes = 0;
  let short = false;
  if (cap > 0)
    search(lv, {
      enter: () => {
        nodes++;
        return true;
      },
      win: (placed) => {
        sols.push(placed.slice());
        if (placed.length < minLen) short = true;
        return sols.length < cap && !short;
      },
    });
  return { sols, nodes, short };
}

/**
 * Looks for any winning arrangement, giving up after looking at `budget` arrangements. True when one is found, false
 * when there is none, null when it gave up. Most random draws have no solution and proving that takes a full search,
 * while a solvable draw usually shows a solution early, so the generator uses this as a cheap first filter.
 *
 * Arrangements the pruning skips are not looked at and do not count, so a budget now covers far more of the search
 * than it did before pruning (about ten to forty times as many arrangements of the old search, each looked-at one
 * costing a little more): it gives up less often, and whenever the old search answered within a budget, this one
 * answers the same within it.
 */
export function hasSolution(lv: Level, budget: number): boolean | null {
  let nodes = 0;
  let found = false;
  let cut = false;
  search(lv, {
    enter: () => {
      cut = ++nodes > budget;
      return !cut;
    },
    win: () => {
      found = true;
      return false;
    },
  });
  return found ? true : cut ? null : false;
}
