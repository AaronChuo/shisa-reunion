// Compares the two ways of generating levels on the same stage configs, each for a fixed time (BENCH_MS, default
// 3000): draw-and-check (`attempt`) and 逆築 (`attemptBackbuild`). Prints how fast each one makes qualifying levels
// and what those levels are like, so a change to either can be checked for speed and for sameness.
// Run with `pnpm bench:gen`.
import { describe, it } from 'vitest';
import { type Element, stageCfg, ZONES } from '../src/content/zones';
import { findRoute, makeGrid, rng, solve } from '../src/engine';
import { attempt, attemptBackbuild } from '../src/engine/generator';
import type { GenConfig, Level } from '../src/engine/types';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);
type Case = [string, string, number, Element[], ((c: GenConfig) => void)?];
const CASES: Case[] = [
  ['那霸市 plain', 'naha', 2, []],
  ['讀谷村 ladder', 'yomitan', 2, ['ladder']],
  ['美麗海 urchin+ladder', 'motobu', 2, ['urchin', 'ladder']],
  ['古宇利島 spring', 'kouri', 2, ['spring']],
  ['竹富島 star+urchin', 'taketomi', 2, ['star', 'urchin']],
  ['西表島 vine+urchin', 'iriomote', 2, ['vine', 'urchin']],
  ['首里城 gate', 'shuri', 2, ['gate']],
  ['首里城 gate+urchin+spring', 'shuri', 2, ['gate', 'urchin', 'spring']],
  ['首里城 gate, 10 wide', 'shuri', 2, ['gate'], (c) => Object.assign(c, { w: 10, obs: [0, 5] })],
  ['slide, 9 wide', 'kouri', 3, ['slide'], (c) => Object.assign(c, { w: 9, obs: [2, 5] })],
  ['stone bridge+urchin, 9 wide', 'shuri', 2, ['long', 'urchin'], (c) => Object.assign(c, { w: 9, obs: [2, 5] })],
];
const WINDOW = Number(process.env.BENCH_MS ?? 3000);

/** What the levels are like: solutions, length and height of the walk, kinds of move, kinds of block */
function traits(lvs: Level[]): string {
  const sum = { sols: 0, walk: 0, top: 0, moves: 0, kinds: 0 };
  for (const lv of lvs) {
    const sol = solve(lv, 1).sols[0];
    const route = findRoute(makeGrid(lv, sol), lv.hero, lv.goal, lv.stars) ?? [];
    sum.sols += lv.solutions ?? 0;
    sum.walk += route.length;
    sum.top += Math.max(0, ...route.map((p) => p.s.y));
    sum.moves += new Set(route.map((p) => p.via).filter(Boolean)).size;
    sum.kinds += new Set(lv.inv).size;
  }
  const n = Math.max(1, lvs.length);
  return [sum.sols, sum.walk, sum.top, sum.moves, sum.kinds].map((v) => (v / n).toFixed(1)).join(' | ');
}

describe('level generation benchmark', () => {
  it('compares draw-and-check with 逆築', () => {
    const rows = ['| stage | method | levels | ms per level | solutions | walk | top | moves | block kinds |', '|---|---|---|---|---|---|---|---|---|'];
    for (const [label, z, si, els, tweak] of CASES) {
      const cfg = stageCfg(zi(z), si, els);
      tweak?.(cfg);
      for (const [name, fn] of [
        ['draw', attempt],
        ['逆築', attemptBackbuild],
      ] as const) {
        const r = rng(4242);
        const got: Level[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < WINDOW) {
          const lv = fn(r, cfg);
          if (lv) got.push(lv);
        }
        const ms = got.length ? Math.round((performance.now() - t0) / got.length) : '—';
        rows.push(`| ${label} | ${name} | ${got.length} | ${ms} | ${traits(got.slice(0, 40))} |`);
      }
    }
    process.stdout.write(`\n${rows.join('\n')}\n\n`);
  });
});
