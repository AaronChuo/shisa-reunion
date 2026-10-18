import { describe, expect, it } from 'vitest';
import type { Element } from '../content/zones';
import { stageCfg, ZONES } from '../content/zones';
import { backbuild, walkFits } from './backbuild';
import { drawTerrain, methodsFor, rng } from './generator';
import { makeGrid } from './grid';
import { findRoute } from './path';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);

/** Draws terrains until 逆築 builds a road on one, returning the level with its tray and the road */
function built(id: string, els: Element[], seed: number) {
  const cfg = stageCfg(zi(id), 2, els);
  const r = rng(seed);
  for (let i = 0; i < 5000; i++) {
    const lv = drawTerrain(r, cfg);
    if (!lv || findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)) continue;
    const b = backbuild(r, lv, cfg);
    if (b) return { cfg, lv: { ...lv, inv: b.inv }, placed: b.placed };
  }
  throw new Error(`no road built for ${id} ${els.join('+')}`);
}

const CASES: [string, Element[]][] = [
  ['naha', []],
  ['yomitan', ['ladder']],
  ['motobu', ['urchin', 'ladder']],
  ['kouri', ['spring']],
  ['taketomi', ['star', 'urchin']],
  ['shuri', ['gate']],
  ['shuri', ['gate', 'urchin', 'spring']],
];

describe('逆築 (building the answer first)', () => {
  it.each(CASES)('builds a road in %s with %j that needs every block and fits the stage', (id, els) => {
    for (const seed of [1, 2, 3]) {
      const { cfg, lv, placed } = built(id, els, seed);
      expect(placed).toHaveLength(cfg.k);
      expect([...placed.map((p) => p.t)].sort()).toEqual(lv.inv);
      for (const t of cfg.must) expect(lv.inv).toContain(t);
      const g = makeGrid(lv, placed);
      const route = findRoute(g, lv.hero, lv.goal, lv.stars);
      expect(route).not.toBeNull();
      expect(route && walkFits(route, g, lv, cfg)).toBe(true);
      for (let i = 0; i < placed.length; i++) {
        const rest = placed.filter((_, j) => j !== i);
        expect(findRoute(makeGrid(lv, rest), lv.hero, lv.goal, lv.stars), `block ${i} is not needed`).toBeNull();
      }
    }
  });

  it('puts a block on the stone gate’s plate', () => {
    const { lv, placed } = built('shuri', ['gate'], 4);
    expect(makeGrid(lv, placed).gateOpen).toBe(true);
  });

  it('leaves stages with a vine to drawing, and tries 逆築 first everywhere else', () => {
    expect(methodsFor(stageCfg(zi('iriomote'), 2, ['vine']))).toEqual(['draw']);
    expect(methodsFor(stageCfg(zi('shuri'), 2, ['gate']))).toEqual(['backbuild', 'draw']);
  });
});
