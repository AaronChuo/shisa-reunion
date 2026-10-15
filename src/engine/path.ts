import { at } from './grid';
import { H, OPEN, STAND } from './pieces';
import type { Grid, Move, PathStep, Pos, Surface } from './types';

/** All walkable surfaces in the grid; anything below the waterline is flooded */
export function surfaces(g: Grid): Surface[] {
  const S: Surface[] = [];
  for (let x = 0; x < g.w; x++) {
    for (let y = 0; y <= H; y++) {
      const c = at(g, x, y);
      if (!c || OPEN.has(c.k)) {
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
        if (ok && y >= g.water) S.push({ x, y, l: y, r: y, ramp: false, spring, ladder: !!c && c.k === 'ladder' });
      }
      if (c && (c.k === 'stairR' || c.k === 'stairL') && y >= g.water) {
        const above = at(g, x, y + 1);
        if (!above || above.k === 'char') {
          const up = c.k === 'stairR';
          S.push({ x, y, l: up ? y : y + 1, r: up ? y + 1 : y, ramp: true, spring: false, ladder: false });
        }
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

/** How a character gets from surface a to surface b, or null if it can't */
export function edge(g: Grid, a: Surface, b: Surface): Move | null {
  if (a.x === b.x) {
    if (a.ramp || b.ramp) return null;
    if ((a.ladder && b.y === a.y + 1) || (b.ladder && a.y === b.y + 1)) return 'climb';
    return null;
  }
  if (Math.abs(a.x - b.x) !== 1) return null;
  const [L, R] = a.x < b.x ? [a, b] : [b, a];
  const d = R.l - L.r;
  if (d === 0) return 'walk';
  if (L.spring && d >= 1 && d <= 2 && headroom(g, L.x, L.y + 1, L.y + d)) return 'jump';
  if (R.spring && d <= -1 && d >= -2 && headroom(g, R.x, R.y + 1, R.y - d)) return 'jump';
  return null;
}

/** Shortest walk from one standing spot to another, or null when they aren't connected */
export function findPath(g: Grid, from: Pos, to: Pos): PathStep[] | null {
  const S = surfaces(g);
  const idx = (p: Pos) => S.findIndex((s) => !s.ramp && s.x === p.x && s.y === p.y);
  const a = idx(from);
  const b = idx(to);
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
        if (prev[j] !== -1) continue;
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
