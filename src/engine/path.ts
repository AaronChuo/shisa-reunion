import { at } from './grid';
import { H, OPEN, STAND } from './pieces';
import type { Grid, Move, PathStep, Pos, Surface } from './types';

const flat = (x: number, y: number, extra: Partial<Surface> = {}): Surface => ({
  x,
  y,
  l: y,
  r: y,
  ramp: false,
  spring: false,
  ladder: false,
  hang: false,
  slide: null,
  ...extra,
});

/** All walkable surfaces in the grid; anything below the waterline is flooded */
export function surfaces(g: Grid): Surface[] {
  const S: Surface[] = [];
  for (let x = 0; x < g.w; x++) {
    for (let y = 0; y <= H; y++) {
      const c = at(g, x, y);
      if (c?.k === 'vine') {
        // Holding on to a vine needs nothing underfoot
        if (y >= g.water) S.push(flat(x, y, { ladder: true, hang: true }));
      } else if (!c || OPEN.has(c.k)) {
        let ok = false;
        let spring = false;
        if (y === 0) ok = !g.urchin.includes(x);
        else {
          const b = at(g, x, y - 1);
          if (b && STAND.has(b.k)) {
            ok = true;
            spring = b.k === 'spring';
          }
        }
        if (ok && y >= g.water) S.push(flat(x, y, { spring, ladder: !!c && c.k === 'ladder' }));
      }
      if (!c || y < g.water) continue;
      const above = at(g, x, y + 1);
      const clear = !above || above.k === 'char';
      if ((c.k === 'stairR' || c.k === 'stairL') && clear) {
        const up = c.k === 'stairR';
        S.push({ ...flat(x, y), l: up ? y : y + 1, r: up ? y + 1 : y, ramp: true });
      }
      if ((c.k === 'slideR' || c.k === 'slideL') && clear) {
        const downRight = c.k === 'slideR';
        S.push({ ...flat(x, y), l: downRight ? y + 1 : y, r: downRight ? y : y + 1, ramp: true, slide: downRight ? 'R' : 'L' });
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

/** Shortest walk from one standing spot to another, or null when they aren't connected. `avoid` is never passed through. */
export function findPath(g: Grid, from: Pos, to: Pos, avoid?: Pos): PathStep[] | null {
  const S = surfaces(g);
  const a = S.findIndex((s) => samePos(s, from));
  const b = S.findIndex((s) => samePos(s, to));
  if (a < 0 || b < 0) return null;
  const byCol: number[][] = Array.from({ length: g.w }, () => []);
  S.forEach((s, i) => {
    byCol[s.x].push(i);
  });
  const prev = new Array<number>(S.length).fill(-1);
  const via = new Array<Move | null>(S.length).fill(null);
  prev[a] = a;
  const q = [a];
  while (q.length) {
    const i = q.shift() as number;
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
 * The hero's whole walk: over every star sand spot (in whichever order is shortest) and then to the goal,
 * never walking through the goal on the way. Null when any leg is impossible.
 */
export function findRoute(g: Grid, from: Pos, to: Pos, stars: readonly Pos[] = []): PathStep[] | null {
  if (!stars.length) return findPath(g, from, to);
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
      const leg = findPath(g, stops[k], stops[k + 1], to);
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
