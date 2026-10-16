// Capsules tumbling inside the gacha dome: discs under gravity in a round glass bowl, bouncing off each other and
// the glass, with friction that makes them roll. Pure functions over plain data so it can be stepped in tests.

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Turn angle in radians, and spin */
  a: number;
  w: number;
  /** Dropping out through the exit at the bottom: no longer held by the glass */
  out: boolean;
}

export interface Dome {
  cx: number;
  cy: number;
  /** Inner radius of the glass */
  R: number;
  /** Capsule radius */
  r: number;
}

export interface World {
  dome: Dome;
  balls: Ball[];
  nextId: number;
  /** Steps in a row with everything nearly still */
  still: number;
}

export type Rand = () => number;

const GRAVITY = 1400;
const BOUNCE_WALL = 0.32;
const BOUNCE_BALL = 0.38;
const FRICTION = 0.35;
const ITERATIONS = 4;
const DRAG = 0.9992;
const SPIN_DRAG = 0.996;
/** Below this speed (units per second) a capsule counts as resting */
const REST = 6;
/** Knocks slower than this don't bounce, so a resting pile stays put instead of buzzing */
const SOFT = 40;

export const STEP = 1 / 120;

const fits = (w: World, x: number, y: number) => w.balls.every((b) => (b.x - x) ** 2 + (b.y - y) ** 2 >= (2 * w.dome.r + 1) ** 2);

/** Drops a new capsule in from the top of the dome; returns its id, or null when there's no room up there */
export function addBall(w: World, rand: Rand): number | null {
  const { cx, cy, R, r } = w.dome;
  for (let tries = 0; tries < 40; tries++) {
    const x = cx + (rand() - 0.5) * (R - r) * 1.2;
    const y = cy - R * 0.55 + (rand() - 0.5) * r * 2;
    if ((x - cx) ** 2 + (y - cy) ** 2 > (R - r) ** 2 || !fits(w, x, y)) continue;
    const id = w.nextId++;
    w.balls.push({ id, x, y, vx: (rand() - 0.5) * 60, vy: 0, a: rand() * Math.PI * 2, w: 0, out: false });
    w.still = 0;
    return id;
  }
  return null;
}

/** A dome holding `n` capsules, poured in from the top */
export function makeWorld(dome: Dome, n: number, rand: Rand): World {
  const w: World = { dome, balls: [], nextId: 0, still: 0 };
  // Pour them in a few at a time, letting each batch fall before the next, so they never start overlapping
  for (let tries = 0; w.balls.length < n && tries < n * 20; tries++) {
    if (addBall(w, rand) === null) for (let k = 0; k < 30; k++) step(w);
  }
  return w;
}

/** Contact point velocity difference along the tangent, for two discs touching along normal (nx, ny) */
function collideBalls(p: Ball, q: Ball, r: number): number {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const d2 = dx * dx + dy * dy;
  const min = 2 * r;
  if (d2 >= min * min || d2 === 0) return 0;
  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  // Push apart
  const push = (min - d) / 2;
  p.x -= nx * push;
  p.y -= ny * push;
  q.x += nx * push;
  q.y += ny * push;
  const vn = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
  if (vn >= 0) return 0;
  const jn = (-(1 + (vn > -SOFT ? 0 : BOUNCE_BALL)) * vn) / 2;
  p.vx -= jn * nx;
  p.vy -= jn * ny;
  q.vx += jn * nx;
  q.vy += jn * ny;
  // Friction at the contact turns sliding into rolling (solid discs: each side's tangential effective mass is 3)
  const tx = -ny;
  const ty = nx;
  const vt = (q.vx - p.vx) * tx + (q.vy - p.vy) * ty - r * (p.w + q.w);
  const jt = Math.max(-FRICTION * jn, Math.min(FRICTION * jn, -vt / 6));
  p.vx -= jt * tx;
  p.vy -= jt * ty;
  q.vx += jt * tx;
  q.vy += jt * ty;
  p.w -= (2 * jt) / r;
  q.w -= (2 * jt) / r;
  return jn;
}

function collideGlass(b: Ball, dome: Dome): number {
  const dx = b.x - dome.cx;
  const dy = b.y - dome.cy;
  const d = Math.hypot(dx, dy);
  const max = dome.R - dome.r;
  if (d <= max || d === 0) return 0;
  const nx = dx / d;
  const ny = dy / d;
  b.x -= nx * (d - max);
  b.y -= ny * (d - max);
  const vn = b.vx * nx + b.vy * ny;
  if (vn <= 0) return 0;
  const jn = (1 + (vn < SOFT ? 0 : BOUNCE_WALL)) * vn;
  b.vx -= jn * nx;
  b.vy -= jn * ny;
  const tx = -ny;
  const ty = nx;
  const vt = b.vx * tx + b.vy * ty + b.w * dome.r;
  const jt = Math.max(-FRICTION * jn, Math.min(FRICTION * jn, -vt / 3));
  b.vx += jt * tx;
  b.vy += jt * ty;
  b.w += (2 * jt) / dome.r;
  return jn;
}

/**
 * Advances one fixed step. Returns the hardest knock this step (for the clack sound), and removes capsules that
 * have fallen clear of the dome, reporting their ids in `gone`.
 */
export function step(w: World, gone: number[] = []): number {
  const { dome } = w;
  let knock = 0;
  const before = w.balls.map((b) => [b.x, b.y, b.a] as const);
  for (const b of w.balls) {
    b.vy += GRAVITY * STEP;
    b.vx *= DRAG;
    b.vy *= DRAG;
    b.w *= SPIN_DRAG;
    b.x += b.vx * STEP;
    b.y += b.vy * STEP;
    b.a += b.w * STEP;
  }
  for (let it = 0; it < ITERATIONS; it++) {
    for (let i = 0; i < w.balls.length; i++) {
      const p = w.balls[i];
      for (let j = i + 1; j < w.balls.length; j++) knock = Math.max(knock, collideBalls(p, w.balls[j], dome.r));
      if (!p.out) knock = Math.max(knock, collideGlass(p, dome));
    }
  }
  // Judge stillness by how far things actually moved: in a resting pile gravity and the contacts keep cancelling
  // out, so the velocities never quite reach zero even though nothing shifts. A capsule that isn't going anywhere
  // is held by static friction, so it stops turning as well.
  let moving = false;
  w.balls.forEach((b, i) => {
    const [x, y, a] = before[i];
    if (!b.out && Math.hypot(b.x - x, b.y - y) / STEP < REST) {
      b.w = 0;
      b.a = a;
    } else moving = true;
  });
  for (let i = w.balls.length - 1; i >= 0; i--) {
    const b = w.balls[i];
    if (b.out && b.y > dome.cy + dome.R + dome.r) {
      gone.push(b.id);
      w.balls.splice(i, 1);
    }
  }
  w.still = moving ? 0 : w.still + 1;
  return knock;
}

/** True once everything has rested for a moment, so the animation loop can stop */
export const asleep = (w: World): boolean => w.still > 30;

/** A shake from the crank: the stirrer under the capsules kicks the low ones up hardest */
export function agitate(w: World, strength: number, rand: Rand): void {
  const { cy, R } = w.dome;
  for (const b of w.balls) {
    if (b.out) continue;
    const low = Math.min(1, Math.max(0.2, (b.y - cy) / R + 0.6));
    b.vx += (rand() - 0.5) * strength * low;
    b.vy -= rand() * strength * 0.7 * low;
    b.w += (rand() - 0.5) * 8;
  }
  w.still = 0;
}

/** Lets the lowest capsule fall through the exit; the rest roll down into the gap on their own. Returns its id. */
export function release(w: World): number | null {
  const inside = w.balls.filter((b) => !b.out);
  if (!inside.length) return null;
  const low = inside.reduce((a, b) => (b.y > a.y ? b : a));
  low.out = true;
  low.vx *= 0.2;
  low.vy = Math.max(low.vy, 120);
  w.still = 0;
  return low.id;
}

/** Capsules still in the dome */
export const inside = (w: World): Ball[] => w.balls.filter((b) => !b.out);
