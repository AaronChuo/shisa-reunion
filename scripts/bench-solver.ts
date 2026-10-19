// Times the solver on its own, on hard stages (4–5 blocks, the stone gate on 10 columns, the tide with 5 blocks), against
// the solver as it was before relevance pruning (`solver.reference.ts`). For each stage it builds levels with 逆築
// (solvable, so the judge's search runs to the end) and draws raw terrains (mostly unsolvable: the draw method's cheap
// filter, and the whole search it takes to prove there is no road), prints positions looked at and milliseconds for
// both solvers, and checks they give the same answers.
// Run with `pnpm bench:solver`; BENCH_LEVELS sets how many levels of each kind per stage (default 6).
import { describe, expect, it } from 'vitest';
import { type Element, STAGES, stageCfg, ZONES } from '../src/content/zones';
import { findRoute, makeGrid, rng } from '../src/engine';
import { backbuild } from '../src/engine/backbuild';
import { drawTerrain } from '../src/engine/generator';
import { hasSolution, solve } from '../src/engine/solver';
import { hasSolution as hasSolutionRef, solve as solveRef } from '../src/engine/solver.reference';
import type { GenConfig, Level } from '../src/engine/types';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);
type Case = [string, string, number, Element[], Partial<GenConfig>];
const wide = (w: number, k: number): Partial<GenConfig> => ({ w, k, obs: [Math.max(0, w - 7), w - 4] });
const CASES: Case[] = [
  ['plain, 4 blocks, 10 wide', 'shuri', 2, [], wide(10, 4)],
  ['plain, 5 blocks, 10 wide', 'shuri', 2, [], wide(10, 5)],
  ['gate, 4 blocks, 10 wide', 'shuri', 2, ['gate'], { w: 10, k: 4, obs: [0, 5] }],
  ['gate, 5 blocks, 10 wide', 'shuri', 2, ['gate'], { w: 10, k: 5, obs: [0, 5] }],
  ['tide, 4 blocks, 10 wide', 'kumejima', 2, ['tide'], wide(10, 4)],
  ['tide, 5 blocks, 10 wide', 'kumejima', 2, ['tide'], wide(10, 5)],
  ['star+urchin, 5 blocks, 9 wide', 'taketomi', 2, ['star', 'urchin'], wide(9, 5)],
  ['slide, 5 blocks, 9 wide', 'miyako', 2, ['slide'], wide(9, 5)],
  ['long+urchin, 5 blocks, 10 wide', 'shuri', 2, ['long', 'urchin'], wide(10, 5)],
  ['spring+ladder, 5 blocks, 10 wide', 'shuri', 2, ['spring', 'ladder'], wide(10, 5)],
  ['vine, 4 blocks, 9 wide', 'iriomote', STAGES - 1, ['vine'], wide(9, 4)],
];
const N = Number(process.env.BENCH_LEVELS ?? 6);

/** Levels 逆築 could build a road on (solvable) and raw draws (mostly not), the same ones every run */
function levels(cfg: GenConfig, seed: number): { built: Level[]; drawn: Level[] } {
  const r = rng(seed);
  const built: Level[] = [];
  const drawn: Level[] = [];
  for (let i = 0; i < 20000 && (drawn.length < N || (built.length < N && !cfg.must.includes('vine'))); i++) {
    const lv = drawTerrain(r, cfg);
    if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) continue;
    if (drawn.length < N) {
      drawn.push(lv);
      continue;
    }
    const b = backbuild(r, lv, cfg);
    if (b) built.push({ ...lv, inv: b.inv });
  }
  return { built, drawn };
}

/** For searches with no count of positions */
const none = () => 0;

/** Runs `before` and `after` on every level, checks they agree, and gives a table row of positions and times */
function compare<T>(
  label: string,
  search: string,
  lvs: Level[],
  before: (lv: Level) => T,
  after: (lv: Level) => T,
  nodes: (x: T) => number,
  same: (a: T, b: T) => void,
): string {
  const t = { before: { nodes: 0, ms: 0, max: 0 }, after: { nodes: 0, ms: 0, max: 0 } };
  for (const lv of lvs) {
    const out: T[] = [];
    for (const [side, fn] of [
      ['before', before],
      ['after', after],
    ] as const) {
      const t0 = performance.now();
      const x = fn(lv);
      const ms = performance.now() - t0;
      t[side].ms += ms;
      t[side].max = Math.max(t[side].max, ms);
      t[side].nodes += nodes(x);
      out.push(x);
    }
    same(out[0], out[1]);
  }
  const n = Math.max(1, lvs.length);
  const avg = (v: number) => (v / n).toFixed(1);
  const faster = t.after.ms > 0 ? `${(t.before.ms / t.after.ms).toFixed(1)}×` : '—';
  const nodeCol = nodes === none ? '—' : `${Math.round(t.before.nodes / n)} → ${Math.round(t.after.nodes / n)}`;
  return `| ${label} | ${search} | ${lvs.length} | ${nodeCol} | ${avg(t.before.ms)} → ${avg(t.after.ms)} | ${t.before.max.toFixed(0)} → ${t.after.max.toFixed(0)} | ${faster} |`;
}
describe('solver benchmark', () => {
  it('times the solver against the one before relevance pruning on hard stages', () => {
    const rows = ['| stage | search | levels | positions (avg) | ms avg | ms max | faster |', '|---|---|---|---|---|---|---|'];
    for (const [label, z, si, els, over] of CASES) {
      const cfg = { ...stageCfg(zi(z), si, els), ...over };
      const { built, drawn } = levels(cfg, 4242);
      type Solved = ReturnType<typeof solve>;
      const sameSolve = (a: Solved, b: Solved) => {
        expect(b.sols).toEqual(a.sols);
        expect(b.short).toBe(a.short);
      };
      // The judge: count solutions up to the stage's limit, stop at a win with fewer blocks
      const judge = (fn: typeof solve) => (lv: Level) => fn(lv, cfg.maxSols + 1, { minLen: lv.inv.length });
      if (built.length) rows.push(compare(label, 'judge (逆築 levels)', built, judge(solveRef), judge(solve), (x) => x.nodes, sameSolve));
      // Proving a raw draw has no road (or finding one): the whole search
      const full = (fn: typeof solve) => (lv: Level) => fn(lv, 1);
      rows.push(compare(label, 'whole search (raw draws)', drawn, full(solveRef), full(solve), (x) => x.nodes, sameSolve));
      // The draw method's cheap filter with its budget of positions: decided (true or false) instead of giving up
      const budget = 20 * cfg.w;
      const decided = [0, 0];
      const filter = (fn: typeof hasSolution, i: number) => (lv: Level) => {
        const x = fn(lv, budget);
        if (x !== null) decided[i]++;
        return x;
      };
      const row = compare(label, 'filter', drawn, filter(hasSolutionRef, 0), filter(hasSolution, 1), none, (a, b) => {
        if (a !== null) expect(b).toBe(a);
      });
      rows.push(row.replace('| filter |', `| filter, budget ${budget}, decided ${decided[0]} → ${decided[1]} |`));
    }
    process.stdout.write(`\n${rows.join('\n')}\n\n`);
  });
});
