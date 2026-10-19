// Times generate() one level after another with the game's real budget, on the same cases as the generation sweep
// (src/content/generation.sweep.test.ts): every element combination a run can put on a stop. Prints mean, p95, how many
// levels took over 2.2 s (the budget before the first relax step) and how many were relaxed, then the slowest levels.
// Run with `pnpm bench:sweep` on an otherwise idle machine. Env: SEEDS (default 1,2,3), ONLY (zone ids or elements),
// STOPS (0-based stop indices), EXCEPT (elements to leave out), TOP (how many of the slowest to list, default 25).
import { describe, it } from 'vitest';
import { allowed, type Element, relax, STAGES, stageCfg, TIERS, ZONES } from '../src/content/zones';
import { generate } from '../src/engine';
import type { GenConfig } from '../src/engine/types';

const subsets = <T>(a: readonly T[], max: number): T[][] => {
  const out: T[][] = [[]];
  for (const x of a) for (const s of out.slice()) if (s.length < max) out.push([...s, x]);
  return out;
};
type Case = [string, number, number, Element[]];
const cases: Case[] = ZONES.flatMap((Z, zi): Case[] => {
  const T = TIERS[Z.tier];
  const own = Z.intro ? [Z.intro] : [];
  const older = ZONES.filter((o, i) => i !== zi && o.intro && o.tier <= Z.tier).map((o) => o.intro as Element);
  const all: [number, Element[]][] = [[0, own]];
  for (const si of [1, 2, 3]) for (const s of subsets([...own, ...older], T.counts.length - 1)) all.push([si, s]);
  for (const s of subsets(older, T.bossExtra[1])) if (s.length >= Math.min(T.bossExtra[0], older.length)) all.push([STAGES - 1, [...own, ...s]]);
  const seen = new Set<string>();
  return all
    .filter(([, els]) => allowed(els))
    .filter(([si, els]) => {
      const key = `${si === STAGES - 1 ? 'last' : stageCfg(zi, si, els).k}:${els.join('+')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(([si, els]): Case => [Z.id, zi, si, els]);
});

describe('sweep timing', () => {
  it('times every case', () => {
    const only = process.env.ONLY?.split(',');
    const seeds = (process.env.SEEDS ?? '1,2,3').split(',').map(Number);
    const stops = process.env.STOPS?.split(',').map(Number);
    const except = process.env.EXCEPT?.split(',');
    const rows: { label: string; ms: number; step: number; lost: boolean }[] = [];
    let total = 0;
    for (const [id, zi, si, els] of cases) {
      if (only && !only.some((o) => id === o || els.includes(o as Element))) continue;
      if (stops && !stops.includes(si)) continue;
      if (except?.some((x) => els.includes(x as Element))) continue;
      const cfg = stageCfg(zi, si, els);
      for (const seed of seeds) {
        let step = 0;
        const watch = (c: GenConfig, s: number) => {
          step = Math.max(step, s);
          return relax(c, s);
        };
        const t0 = performance.now();
        const lv = generate(cfg, seed * 7919 + zi * 101 + si, watch);
        const ms = performance.now() - t0;
        total += ms;
        // Lost something the "next stop" card shows: an element or a block
        const lost = (cfg.gate && !lv.gate) || (cfg.tide && !lv.tide) || (cfg.stars > 0 && !lv.stars.length) || lv.inv.length < cfg.k;
        rows.push({ label: `${id} stop ${si} [${els.join('+')}] w${cfg.w} k${cfg.k} seed ${seed}`, ms, step, lost });
      }
    }
    rows.sort((a, b) => b.ms - a.ms);
    const tag = (r: (typeof rows)[number]) => (r.lost ? 'LOST ' : '') + (r.step ? `RELAXED ${r.step} ` : '');
    const lines = rows.slice(0, Number(process.env.TOP ?? 25)).map((r) => `${r.ms.toFixed(0).padStart(6)} ms ${tag(r)}${r.label}`);
    const sorted = rows.map((r) => r.ms).sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const n = Math.max(1, rows.length);
    process.stdout.write(
      `\nSWEEP ${rows.length} levels, total ${(total / 1000).toFixed(1)} s, mean ${(total / n).toFixed(0)} ms, p95 ${p95.toFixed(0)} ms, ` +
        `max ${(sorted.at(-1) ?? 0).toFixed(0)} ms, over 2.2 s ${rows.filter((r) => r.ms > 2200).length}, ` +
        `relaxed ${rows.filter((r) => r.step).length}, lost an element or block ${rows.filter((r) => r.lost).length}\n${lines.join('\n')}\n\n`,
    );
  });
});
