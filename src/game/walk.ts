import { sfx } from '../audio/sfx';
import type { Level, PathStep, Surface } from '../engine';
import { C, M, Y0 } from './geometry';

export type Leg =
  | { t: 'walk'; s: Surface; x0: number; x1: number }
  | { t: 'climb'; x: number; y0: number; y1: number }
  | { t: 'jump'; x0: number; y0: number; x1: number; y1: number };

/** Height of the feet at x on a surface; stairs are walked one step at a time */
export function feetY(s: Surface, x: number): number {
  if (!s.ramp) return s.y;
  const u = Math.min(0.999, Math.max(0.001, x - s.x));
  return s.y + (s.r > s.l ? Math.ceil(u * 4) / 4 : Math.ceil((1 - u) * 4) / 4);
}

/** Turns a path of surfaces into walk / climb / jump legs the hero animates along */
export function legsFor(path: PathStep[], lv: Level): Leg[] {
  const legs: Leg[] = [];
  let cx = lv.hero.x + 0.5;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i].s;
    const b = path[i + 1].s;
    const via = path[i + 1].via;
    if (via === 'climb') {
      if (Math.abs(cx - (a.x + 0.5)) > 1e-6) legs.push({ t: 'walk', s: a, x0: cx, x1: a.x + 0.5 });
      legs.push({ t: 'climb', x: a.x + 0.5, y0: a.y, y1: b.y });
      cx = a.x + 0.5;
    } else if (via === 'jump') {
      const right = b.x > a.x;
      const bx = right ? a.x + 1 : a.x;
      const tx = a.spring ? a.x + 0.5 : bx - (right ? 0.15 : -0.15);
      if (Math.abs(cx - tx) > 1e-6) legs.push({ t: 'walk', s: a, x0: cx, x1: tx });
      const lx = b.spring ? b.x + 0.5 : bx + (right ? 0.3 : -0.3);
      legs.push({ t: 'jump', x0: tx, y0: feetY(a, tx), x1: lx, y1: feetY(b, lx) });
      cx = lx;
    } else {
      const bx = b.x > a.x ? a.x + 1 : a.x;
      legs.push({ t: 'walk', s: a, x0: cx, x1: bx });
      cx = bx;
    }
  }
  const last = path[path.length - 1].s;
  const gx = lv.goal.x + 0.5;
  const dir = Math.sign(gx - cx) || 1;
  const end = gx - dir * 0.3;
  if (Math.sign(end - cx) === dir) legs.push({ t: 'walk', s: last, x0: cx, x1: end });
  return legs.filter((l) => l.t !== 'walk' || Math.abs(l.x1 - l.x0) > 1e-6);
}

export type HeroPos = { x: number; y: number; flip: boolean };

export const heroTransform = (p: HeroPos): string => `translate(${M + p.x * C},${Y0 - p.y * C})${p.flip ? ' scale(-1,1)' : ''}`;

function endOf(legs: Leg[], fallback: HeroPos): HeroPos {
  const l = legs[legs.length - 1];
  if (!l) return fallback;
  if (l.t === 'walk') return { x: l.x1, y: feetY(l.s, l.x1), flip: l.x1 < l.x0 };
  if (l.t === 'climb') return { x: l.x, y: l.y1, flip: false };
  return { x: l.x1, y: l.y1, flip: l.x1 < l.x0 };
}

/** Animates the hero element along the legs; returns a cancel function */
export function animateWalk(el: SVGGElement | null, path: PathStep[], lv: Level, done: (end: HeroPos) => void): () => void {
  const legs = legsFor(path, lv);
  const start: HeroPos = { x: lv.hero.x + 0.5, y: lv.hero.y, flip: false };
  const end = endOf(legs, start);
  if (!el || !legs.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done(end);
    return () => {};
  }
  const dur = legs.map((l) => (l.t === 'walk' ? (Math.abs(l.x1 - l.x0) / 2.3) * 1000 : l.t === 'climb' ? (Math.abs(l.y1 - l.y0) / 1.6) * 1000 : 560));
  let i = 0;
  let t0: number | null = null;
  let started = -1;
  let raf = 0;
  let flip = false;
  const set = (x: number, y: number) => el.setAttribute('transform', heroTransform({ x, y, flip }));
  const frame = (ts: number) => {
    if (t0 === null) t0 = ts;
    let el2 = ts - t0;
    while (i < legs.length && el2 > dur[i]) {
      el2 -= dur[i];
      t0 += dur[i];
      i++;
    }
    if (i >= legs.length) {
      el.setAttribute('transform', heroTransform(end));
      done(end);
      return;
    }
    const l = legs[i];
    const u = el2 / dur[i];
    if (started !== i) {
      started = i;
      if (l.t === 'jump') sfx.boing();
      if (l.t === 'climb') sfx.climb();
    }
    if (l.t === 'walk') {
      flip = l.x1 < l.x0;
      const x = l.x0 + (l.x1 - l.x0) * u;
      const hop = l.s.ramp ? Math.abs(Math.sin((x - l.s.x) * 4 * Math.PI)) * 0.07 : Math.abs(Math.sin(x * 2 * Math.PI)) * 0.04;
      set(x, feetY(l.s, x) + hop);
    } else if (l.t === 'climb') {
      set(l.x + Math.sin(u * Math.PI * 6) * 0.03, l.y0 + (l.y1 - l.y0) * u);
    } else {
      flip = l.x1 < l.x0;
      const arc = 0.7 + Math.abs(l.y1 - l.y0) * 0.35;
      set(l.x0 + (l.x1 - l.x0) * u, l.y0 + (l.y1 - l.y0) * u + Math.sin(u * Math.PI) * arc);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
