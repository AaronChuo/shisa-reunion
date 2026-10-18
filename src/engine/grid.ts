import { cellsOf, H, HANG_FROM, SUPPORT, shapeOf, sizeOf } from './pieces';
import type { Cell, Grid, Level, PieceType, Placement } from './types';

export const WALL: Cell = { k: 'wall' };

export const waterAt = (lv: Level, moves: number): number => (lv.tide ? Math.min(lv.tide.max, Math.floor(moves / lv.tide.every)) : 0);

/** Builds the occupancy grid for a level with the given placed pieces; `moves` drives the tide */
export function makeGrid(lv: Level, placed: readonly Placement[], moves = placed.length): Grid {
  const w = lv.w;
  const cells: (Cell | null)[] = new Array(w * H).fill(null);
  const pieces = [...lv.fixed, ...placed];
  pieces.forEach((p, i) => {
    for (const [dx, dy, k] of cellsOf(p.t, p.o)) cells[(p.x + dx) * H + p.y + dy] = { i, k };
  });
  // Star sand keeps its spot clear like the figures do, so no block can bury it
  [lv.hero, lv.goal, ...lv.stars].forEach((c, ci) => {
    if (c.y < H) cells[c.x * H + c.y] = { c: ci, k: 'char' };
  });
  let gateOpen = false;
  if (lv.gate) {
    const pc = cells[lv.gate.px * H + lv.gate.py];
    gateOpen = !!pc && pc.i !== undefined;
    for (let y = 0; y < lv.gate.h; y++) cells[lv.gate.x * H + y] = { k: gateOpen ? 'gateOpen' : 'gate' };
  }
  return { w, cells, gateOpen, water: waterAt(lv, moves), urchin: lv.urchin };
}

export function at(g: Grid, x: number, y: number): Cell | null {
  if (x < 0 || x >= g.w || y < 0) return WALL;
  if (y >= H) return null;
  return g.cells[x * H + y];
}

export function fits(g: Grid, t: PieceType, o: number, x: number, y: number): boolean {
  for (const [dx, dy] of shapeOf(t, o).cells) {
    const cx = x + dx;
    const cy = y + dy;
    if (cx < 0 || cx >= g.w || cy < 0 || cy >= H) return false;
    if (g.cells[cx * H + cy]) return false;
  }
  return true;
}

/** A piece stands if its centre of mass lies over the cells resting on a flat top (or the tray) */
export function stable(g: Grid, t: PieceType, o: number, x: number, y: number): boolean {
  const sh = shapeOf(t, o);
  // A vine doesn't stand: it holds if a block with a flat underside sits right above its top
  if (t === 'vine') {
    const above = at(g, x, y + sh.h);
    return !!above && HANG_FROM.has(above.k);
  }
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const [dx, dy] of sh.bottoms) {
    const cy = y + dy;
    const below = cy === 0 ? null : at(g, x + dx, cy - 1);
    if (cy === 0 || (below && SUPPORT.has(below.k))) {
      lo = Math.min(lo, x + dx);
      hi = Math.max(hi, x + dx + 1);
    }
  }
  if (lo === Number.POSITIVE_INFINITY) return false;
  // The long stone bridge has one simple rule children can see: both ends must be held up
  if (t === 'long') {
    const held = (dx: number) => y === 0 || SUPPORT.has(at(g, x + dx, y - 1)?.k ?? '');
    return held(0) && held(2);
  }
  const com = x + sh.massX / sh.mass;
  return com >= lo - 1e-9 && com <= hi + 1e-9;
}

/** Where a piece comes to rest when let go at (x, y): pushed up out of anything it overlaps, then dropped */
export function restY(g: Grid, t: PieceType, o: number, x: number, y: number): number | null {
  const { w, h } = sizeOf(t, o);
  if (x < 0 || x + w > g.w) return null;
  if (t === 'vine') {
    // Hang from the nearest block above or below the drop point
    let best: number | null = null;
    for (let cy = 0; cy + h <= H; cy++) {
      if (fits(g, t, o, x, cy) && stable(g, t, o, x, cy) && (best === null || Math.abs(cy - y) < Math.abs(best - y))) best = cy;
    }
    return best;
  }
  let ry = Math.max(0, Math.min(y, H - h));
  if (!fits(g, t, o, x, ry)) {
    while (ry + h <= H && !fits(g, t, o, x, ry)) ry++;
    if (ry + h > H) return null;
  } else {
    while (ry > 0 && fits(g, t, o, x, ry - 1)) ry--;
  }
  return ry;
}

/** Every resting, stable position for a piece in one orientation */
export function placementsFor(g: Grid, t: PieceType, o: number): Placement[] {
  const { w, h } = sizeOf(t, o);
  const out: Placement[] = [];
  for (let x = 0; x + w <= g.w; x++) {
    for (let y = 0; y + h <= H; y++) {
      if (!fits(g, t, o, x, y)) continue;
      if (t !== 'vine' && y > 0 && fits(g, t, o, x, y - 1)) continue;
      if (!stable(g, t, o, x, y)) continue;
      out.push({ t, o, x, y });
    }
  }
  return out;
}

/** A loose piece can be lifted when nothing (piece or character) rests directly on it */
export function canLift(lv: Level, placed: readonly Placement[], i: number): boolean {
  const g = makeGrid(lv, placed);
  const pi = lv.fixed.length + i;
  const p = placed[i];
  for (const [dx, dy] of cellsOf(p.t, p.o)) {
    // A vine's top touches the block it hangs from, which isn't resting on it
    const c = p.t === 'vine' ? null : at(g, p.x + dx, p.y + dy + 1);
    if (c && c !== WALL && c.i !== pi && (c.i !== undefined || c.k === 'char')) return false;
    // ...nor a vine hanging from it
    const below = at(g, p.x + dx, p.y + dy - 1);
    if (below && below !== WALL && below.k === 'vine' && below.i !== pi) return false;
  }
  return true;
}
