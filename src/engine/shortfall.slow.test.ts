import { describe, expect, it } from 'vitest';
import { type Element, STAGES, stageCfg, ZONES } from '../content/zones';
import { walkFits } from './backbuild';
import { drawTerrain, rng } from './generator';
import { makeGrid } from './grid';
import { findRoute } from './path';
import { couldJoin } from './shortfall';
import { solve } from './solver';
import type { GenConfig, PieceType } from './types';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);

type Case = [string, number, Element[], Partial<GenConfig>?];
const CASES: Case[] = [
  ['naha', STAGES - 1, []],
  ['yomitan', 2, ['ladder']],
  ['motobu', 3, ['urchin', 'ladder']],
  ['nakagusuku', 3, ['long', 'urchin']],
  ['taketomi', 2, ['star', 'urchin']],
  ['taketomi', STAGES - 1, ['star', 'slide']],
  ['taketomi', 2, ['star'], { stars: 2 }],
  ['iriomote', 2, ['vine']],
  ['shuri', 1, ['gate']],
  ['shuri', STAGES - 1, ['gate', 'spring']],
  ['shuri', 2, ['gate', 'ladder', 'urchin']],
  ['shuri', 2, ['gate'], { w: 10, k: 5, obs: [0, 5] }],
  ['kumejima', 1, ['gate']],
  ['kumejima', 2, ['tide']],
  ['kumejima', 2, ['tide', 'slide']],
  ['kumejima', 2, ['tide'], { k: 5 }],
  ['kumejima', 2, ['urchin', 'vine']],
];

// The bound behind 逆築's and drawing's early outs has to be safe: whenever it says a tray cannot join the road, the
// solver must find no road with it either (through the stone gate, when there is one: a road around it would not count).
// A pool turned down for its best blocks turns down every tray drawn from it, so checking trays covers 逆築 too.
describe('shortfall', () => {
  it.each(CASES)('never turns down a tray the solver finds a road with: %s stop %i %j', { timeout: 60000 }, (id, si, els, over) => {
    const cfg = { ...stageCfg(zi(id), si, els), ...over };
    const r = rng(zi(id) * 131 + si * 17 + els.length);
    let turnedDown = 0;
    for (let i = 0; i < 60; i++) {
      const lv = drawTerrain(r, cfg);
      if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) continue;
      const tray: Partial<Record<PieceType, number>> = {};
      for (const t of lv.inv) tray[t] = (tray[t] ?? 0) + 1;
      if (couldJoin(makeGrid(lv, [], lv.inv.length), lv, tray, [], lv.inv.length)) continue;
      turnedDown++;
      const roads = solve(lv, 400).sols.filter((sol) => {
        const g = makeGrid(lv, sol);
        const route = findRoute(g, lv.hero, lv.goal, lv.stars);
        return !!route && walkFits(route, g, lv, { ...cfg, need: [] });
      });
      expect(roads, JSON.stringify(lv)).toEqual([]);
    }
    expect(turnedDown).toBeGreaterThan(0);
  });
});
