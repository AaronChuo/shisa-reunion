import { describe, expect, it } from 'vitest';
import { backbuild } from './backbuild';
import { rng } from './generator';
import { makeGrid } from './grid';
import { couldJoin, shortfall } from './shortfall';
import type { GenConfig, Level, Placement } from './types';

/** Six columns, the goal on the floor at the right */
const level = (fixed: Placement[], over: Partial<Level> = {}): Level => ({
  w: 6,
  fixed,
  hero: { x: 0, y: 0 },
  goal: { x: 5, y: 0 },
  inv: [],
  urchin: [],
  stars: [],
  tide: null,
  gate: null,
  ...over,
});
/** The hero on a tower two rows up at the left */
const ledge = level([{ t: 'tower', o: 0, x: 0, y: 0 }], { hero: { x: 0, y: 2 } });
const lack = (lv: Level) => shortfall(makeGrid(lv, []), lv);

describe('shortfall', () => {
  it('counts the changes of height and the spots to stand on that the walk lacks', () => {
    // Off the tower into the air beside it, then down two rows to the floor
    expect(lack(ledge)).toEqual({ lift: 2, adds: 3 });
  });

  it('uses the slopes and tops the ground already has', () => {
    // The hero on a cube, a stair beside it: its flat top is level with the hero, its slope runs down to the floor
    const lv = level(
      [
        { t: 'cube', o: 0, x: 0, y: 0 },
        { t: 'stair', o: 3, x: 1, y: 0 },
      ],
      { hero: { x: 0, y: 1 } },
    );
    expect(lack(lv)).toEqual({ lift: 0, adds: 0 });
  });

  it('sends the walk through the stone gate, down to the floor and up again', () => {
    const lv = level([...ledge.fixed, { t: 'cube', o: 0, x: 5, y: 0 }], { hero: ledge.hero, goal: { x: 5, y: 1 }, gate: { x: 3, h: 2, px: 2, py: 0 } });
    expect(lack(lv).lift).toBe(3);
  });

  it('counts each leg to and from a star sand spot on its own', () => {
    // Up two rows to a star on a tower and down two again: the dearer leg, not both together
    const lv = level([{ t: 'tower', o: 0, x: 3, y: 0 }], { stars: [{ x: 3, y: 2 }] });
    expect(lack(lv).lift).toBe(2);
  });
});

describe('couldJoin', () => {
  const g = makeGrid(ledge, []);

  it('turns down blocks that cannot make the climb, and takes enough of them', () => {
    expect(couldJoin(g, ledge, { stair: 1, cube: 3 }, [], 4)).toBe(false);
    expect(couldJoin(g, ledge, { stair: 2 }, [], 2)).toBe(true);
    // Only the best k of the pool count
    expect(couldJoin(g, ledge, { stair: 2, cube: 3 }, [], 1)).toBe(false);
  });

  it('counts the blocks the stage must use whatever else the pool has', () => {
    expect(couldJoin(g, ledge, { ladder: 1, stair: 2 }, ['ladder'], 1)).toBe(true);
    expect(couldJoin(g, ledge, { cube: 1, stair: 2 }, ['cube'], 2)).toBe(false);
  });
});

describe('逆築 on a terrain the pool cannot join', () => {
  it('gives up at once', () => {
    const cfg: GenConfig = {
      w: 6,
      k: 3,
      pool: { cube: 3, bridge: 1 },
      must: [],
      need: [],
      maxSols: 8,
      urchin: 0,
      tide: null,
      gate: false,
      stars: 0,
      obs: [0, 0],
    };
    expect(backbuild(rng(1), ledge, cfg)).toBeNull();
  });
});
