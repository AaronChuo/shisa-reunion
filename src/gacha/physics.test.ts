import { describe, expect, it } from 'vitest';
import { rng } from '../engine';
import { agitate, asleep, type Dome, inside, makeWorld, release, STEP, step, type World } from './physics';

const DOME: Dome = { cx: 155, cy: 165, R: 97, r: 19 };

const settle = (w: World, maxSeconds = 8) => {
  for (let i = 0; i < maxSeconds / STEP && !asleep(w); i++) step(w);
};
const centreY = (w: World) => inside(w).reduce((a, b) => a + b.y, 0) / inside(w).length;

describe('capsules in the dome', () => {
  it('fall in and come to rest inside the glass without overlapping', () => {
    const w = makeWorld(DOME, 10, rng(1));
    settle(w);
    expect(asleep(w)).toBe(true);
    expect(w.balls).toHaveLength(10);
    for (const b of w.balls) expect(Math.hypot(b.x - DOME.cx, b.y - DOME.cy)).toBeLessThanOrEqual(DOME.R - DOME.r + 0.5);
    for (const p of w.balls) for (const q of w.balls) if (p !== q) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(2 * DOME.r - 1.5);
  });

  it('pile up at the bottom under gravity', () => {
    const w = makeWorld(DOME, 6, rng(2));
    settle(w);
    expect(centreY(w)).toBeGreaterThan(DOME.cy);
  });

  it('jump about when the crank shakes them, then settle again', () => {
    const w = makeWorld(DOME, 8, rng(3));
    settle(w);
    agitate(w, 400, rng(4));
    expect(asleep(w)).toBe(false);
    step(w);
    expect(Math.max(...w.balls.map((b) => Math.hypot(b.vx, b.vy)))).toBeGreaterThan(50);
    settle(w);
    expect(asleep(w)).toBe(true);
  });

  it('roll as they move rather than only slide', () => {
    const w = makeWorld(DOME, 1, rng(5));
    const b = w.balls[0];
    // A lone capsule let go on the side of the bowl rolls down it
    Object.assign(b, { x: DOME.cx + 60, y: DOME.cy, vx: 0, vy: 0, w: 0, a: 0 });
    for (let i = 0; i < 60; i++) step(w);
    expect(Math.abs(b.a)).toBeGreaterThan(0.5);
  });
});

describe('dropping a capsule', () => {
  it('lets the lowest one fall out and the rest roll down into the gap', () => {
    const w = makeWorld(DOME, 9, rng(6));
    settle(w);
    const lowest = w.balls.reduce((a, b) => (b.y > a.y ? b : a)).id;
    const rest = w.balls.filter((b) => b.id !== lowest);
    const before = rest.reduce((a, b) => a + b.y, 0) / rest.length;
    expect(release(w)).toBe(lowest);
    const gone: number[] = [];
    for (let i = 0; i < 4 / STEP && !(gone.length && asleep(w)); i++) step(w, gone);
    expect(gone).toEqual([lowest]);
    expect(w.balls).toHaveLength(8);
    // Without the bottom capsule the others roll down and sit lower than before
    expect(centreY(w)).toBeGreaterThan(before + 2);
  });

  it('has nothing to drop from an empty dome', () => {
    expect(release(makeWorld(DOME, 0, rng(7)))).toBeNull();
  });
});
