import { at } from './grid';
import { H, OPEN, STAND } from './pieces';
import type { Grid, Move, PathStep, Pos, Surface } from './types';

const surface = (
  x: number,
  y: number,
  l: number,
  r: number,
  ramp: boolean,
  spring: boolean,
  ladder: boolean,
  hang: boolean,
  slide: 'R' | 'L' | null,
): Surface => ({
  x,
  y,
  l,
  r,
  ramp,
  spring,
  ladder,
  hang,
  slide,
});

/** All walkable surfaces in the grid; anything below the waterline is flooded */
export function surfaces(g: Grid): Surface[] {
  const S: Surface[] = [];
  const { cells, w, water, urchin } = g;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y <= H; y++) {
      const c = y < H ? cells[x * H + y] : null;
      const k = c?.k;
      if (k === 'vine') {
        // Holding on to a vine needs nothing underfoot
        if (y >= water) S.push(surface(x, y, y, y, false, false, true, true, null));
      } else if (!c || OPEN.has(k as string)) {
        let ok = false;
        let spring = false;
        if (y === 0) ok = !urchin.includes(x);
        else {
          const b = cells[x * H + y - 1];
          if (b && STAND.has(b.k)) {
            ok = true;
            spring = b.k === 'spring';
          }
        }
        if (ok && y >= water) S.push(surface(x, y, y, y, false, spring, k === 'ladder', false, null));
      }
      if (!c || y < water) continue;
      const above = y + 1 < H ? cells[x * H + y + 1] : null;
      const clear = !above || above.k === 'char';
      if ((k === 'stairR' || k === 'stairL') && clear) {
        const up = k === 'stairR';
        S.push(surface(x, y, up ? y : y + 1, up ? y + 1 : y, true, false, false, false, null));
      }
      if ((k === 'slideR' || k === 'slideL') && clear) {
        const downRight = k === 'slideR';
        S.push(surface(x, y, downRight ? y + 1 : y, downRight ? y : y + 1, true, false, false, false, downRight ? 'R' : 'L'));
      }
    }
  }
  return S;
}

function headroom(g: Grid, x: number, y0: number, y1: number): boolean {
  for (let y = y0; y <= y1; y++) {
    const c = at(g, x, y);
    if (c && c.k !== 'char') return false;
  }
  return true;
}

/** How a character gets from surface a to surface b (in that direction), or null if it can't */
export function edge(g: Grid, a: Surface, b: Surface): Move | null {
  if (a.x === b.x) {
    if (a.ramp || b.ramp || Math.abs(a.y - b.y) !== 1) return null;
    const [lo, hi] = a.y < b.y ? [a, b] : [b, a];
    if (lo.hang || hi.hang) return 'hang';
    if (lo.ladder) return 'climb';
    return null;
  }
  if (Math.abs(a.x - b.x) !== 1) return null;
  const right = b.x > a.x;
  // Slides only go downhill: enter at the high end, leave at the low end
  if (b.slide && b.slide !== (right ? 'R' : 'L')) return null;
  if (a.slide && a.slide !== (right ? 'R' : 'L')) return null;
  const out = right ? a.r : a.l;
  const into = right ? b.l : b.r;
  if (out === into) return b.slide ? 'slide' : 'walk';
  if (a.slide || b.slide) return null;
  const [L, R] = right ? [a, b] : [b, a];
  const d = R.l - L.r;
  if (L.spring && d >= 1 && d <= 2 && headroom(g, L.x, L.y + 1, L.y + d)) return 'jump';
  if (R.spring && d <= -1 && d >= -2 && headroom(g, R.x, R.y + 1, R.y - d)) return 'jump';
  return null;
}

const samePos = (s: Surface, p: Pos) => !s.ramp && s.x === p.x && s.y === p.y;

/** A grid's walkable surfaces, indexed by column, so several walks on the same grid share the work */
export interface Walkable {
  S: Surface[];
  byCol: number[][];
}

export function walkable(g: Grid): Walkable {
  const S = surfaces(g);
  const byCol: number[][] = Array.from({ length: g.w }, () => []);
  S.forEach((s, i) => {
    byCol[s.x].push(i);
  });
  return { S, byCol };
}

/** Shortest walk from one standing spot to another, or null when they aren't connected. `avoid` is never passed through. */
export function findPath(g: Grid, from: Pos, to: Pos, avoid?: Pos, ws: Walkable = walkable(g)): PathStep[] | null {
  const { S, byCol } = ws;
  const a = S.findIndex((s) => samePos(s, from));
  const b = S.findIndex((s) => samePos(s, to));
  if (a < 0 || b < 0) return null;
  const prev = new Array<number>(S.length).fill(-1);
  const via = new Array<Move | null>(S.length).fill(null);
  prev[a] = a;
  const q = [a];
  for (let head = 0; head < q.length; head++) {
    const i = q[head];
    if (i === b) break;
    const x = S[i].x;
    for (let cx = x - 1; cx <= x + 1; cx++) {
      if (cx < 0 || cx >= g.w) continue;
      for (const j of byCol[cx]) {
        if (prev[j] !== -1 || (avoid && j !== b && samePos(S[j], avoid))) continue;
        const e = edge(g, S[i], S[j]);
        if (e) {
          prev[j] = i;
          via[j] = e;
          q.push(j);
        }
      }
    }
  }
  if (prev[b] === -1) return null;
  const path: PathStep[] = [];
  for (let i = b; ; i = prev[i]) {
    path.unshift({ s: S[i], via: via[i] });
    if (i === a) break;
  }
  return path;
}

/**
 * 走走看: as far as the hero gets towards `to` on the road as it stands. The walk to the reachable spot nearest the
 * goal (the fewest steps on a tie), never through the goal; just the starting spot when nothing gets any closer.
 */
export function walkAsFar(g: Grid, from: Pos, to: Pos, ws: Walkable = walkable(g)): PathStep[] {
  const { S, byCol } = ws;
  const a = S.findIndex((s) => samePos(s, from));
  if (a < 0) return [];
  const away = (s: Surface) => Math.hypot(s.x - to.x, s.y - to.y);
  const prev = new Array<number>(S.length).fill(-1);
  const via = new Array<Move | null>(S.length).fill(null);
  prev[a] = a;
  let best = a;
  const q = [a];
  for (let head = 0; head < q.length; head++) {
    const i = q[head];
    // Breadth first, so the first spot found at a distance is also the shortest walk there
    if (away(S[i]) < away(S[best]) - 1e-9) best = i;
    const x = S[i].x;
    for (let cx = x - 1; cx <= x + 1; cx++) {
      if (cx < 0 || cx >= g.w) continue;
      for (const j of byCol[cx]) {
        if (prev[j] !== -1 || samePos(S[j], to)) continue;
        const e = edge(g, S[i], S[j]);
        if (e) {
          prev[j] = i;
          via[j] = e;
          q.push(j);
        }
      }
    }
  }
  const path: PathStep[] = [];
  for (let i = best; ; i = prev[i]) {
    path.unshift({ s: S[i], via: via[i] });
    if (i === a) break;
  }
  return path;
}

/**
 * The hero's whole walk: over every star sand spot (in whichever order is shortest) and then to the goal,
 * never walking through the goal on the way. Null when any leg is impossible.
 */
export function findRoute(g: Grid, from: Pos, to: Pos, stars: readonly Pos[] = [], ws: Walkable = walkable(g)): PathStep[] | null {
  if (!stars.length) return findPath(g, from, to, undefined, ws);
  const orders =
    stars.length === 1
      ? [[0]]
      : stars.length === 2
        ? [
            [0, 1],
            [1, 0],
          ]
        : [stars.map((_, i) => i)];
  let best: PathStep[] | null = null;
  for (const order of orders) {
    const stops = [from, ...order.map((i) => stars[i]), to];
    let route: PathStep[] = [];
    let ok = true;
    for (let k = 0; k < stops.length - 1; k++) {
      const leg = findPath(g, stops[k], stops[k + 1], to, ws);
      if (!leg) {
        ok = false;
        break;
      }
      route = route.length ? route.concat(leg.slice(1)) : leg;
    }
    if (ok && (!best || route.length < best.length)) best = route;
  }
  return best;
}
