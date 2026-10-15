import { describe, expect, it } from 'vitest';
import { canLift, findPath, makeGrid, restY, solve, stable } from '.';
import type { Level, Placement } from './types';

const level = (over: Partial<Level>): Level => ({
  w: 6,
  fixed: [],
  hero: { x: 0, y: 0 },
  goal: { x: 5, y: 0 },
  inv: [],
  urchin: [],
  tide: null,
  gate: null,
  ...over,
});

describe('physics', () => {
  // The physical game photo: a stair rests on a cube with its stepped half hanging over an empty slot
  const photo = level({
    fixed: [
      { t: 'cube', o: 0, x: 0, y: 0 },
      { t: 'bridge', o: 0, x: 1, y: 0 },
      { t: 'cube', o: 0, x: 3, y: 0 },
      { t: 'tower', o: 0, x: 4, y: 0 },
    ],
    hero: { x: 0, y: 1 },
    goal: { x: 4, y: 2 },
  });

  it('keeps a stair standing when only its solid half is supported', () => {
    const g = makeGrid(photo, []);
    expect(stable(g, 'stair', 0, 2, 1)).toBe(true);
  });

  it('tips a stair over when only its stepped half is supported', () => {
    const g = makeGrid(photo, []);
    expect(stable(g, 'stair', 0, 1, 1)).toBe(false);
  });

  it('drops a piece onto the highest support below where it is let go', () => {
    const g = makeGrid(photo, []);
    expect(restY(g, 'stair', 0, 2, 4)).toBe(1);
  });

  it('connects both figures across the overhanging stair', () => {
    const g = makeGrid(photo, [{ t: 'stair', o: 0, x: 2, y: 1 }]);
    expect(findPath(g, photo.hero, photo.goal)).not.toBeNull();
  });

  it('balances the long stone bridge on its middle but not on one end', () => {
    const lv = level({ fixed: [{ t: 'tower', o: 0, x: 2, y: 0 }], hero: { x: 0, y: 0 }, goal: { x: 5, y: 0 } });
    const g = makeGrid(lv, []);
    expect(stable(g, 'long', 0, 1, 2)).toBe(true);
    expect(stable(g, 'long', 0, 2, 2)).toBe(false);
  });

  it('refuses to lift a piece that has another piece on top', () => {
    const lv = level({});
    const placed: Placement[] = [
      { t: 'cube', o: 0, x: 2, y: 0 },
      { t: 'cube', o: 0, x: 2, y: 1 },
    ];
    expect(canLift(lv, placed, 0)).toBe(false);
    expect(canLift(lv, placed, 1)).toBe(true);
  });
});

describe('walking', () => {
  it('finds the single solution of the classic two-stair challenge', () => {
    const lv = level({
      fixed: [
        { t: 'tower', o: 0, x: 4, y: 0 },
        { t: 'tower', o: 0, x: 5, y: 0 },
      ],
      hero: { x: 5, y: 2 },
      goal: { x: 0, y: 0 },
      inv: ['stair', 'stair'],
    });
    expect(solve(lv).sols).toHaveLength(1);
  });

  it('climbs a ladder two levels inside one column', () => {
    const lv = level({ fixed: [{ t: 'tower', o: 0, x: 3, y: 0 }], hero: { x: 0, y: 0 }, goal: { x: 3, y: 2 } });
    const g = makeGrid(lv, [{ t: 'ladder', o: 0, x: 2, y: 0 }]);
    const path = findPath(g, lv.hero, lv.goal);
    expect(path?.some((p) => p.via === 'climb')).toBe(true);
  });

  it('bounces off a clam up two levels but never stacks on it', () => {
    const lv = level({
      fixed: [
        { t: 'cube', o: 0, x: 1, y: 0 },
        { t: 'tower', o: 0, x: 3, y: 0 },
        { t: 'cube', o: 0, x: 3, y: 2 },
      ],
      hero: { x: 1, y: 1 },
      goal: { x: 3, y: 3 },
    });
    const placed: Placement[] = [{ t: 'spring', o: 0, x: 2, y: 0 }];
    const g = makeGrid(lv, placed, 1);
    expect(findPath(g, lv.hero, lv.goal)?.some((p) => p.via === 'jump')).toBe(true);
    expect(stable(g, 'cube', 0, 2, 1)).toBe(false);
  });

  it('cannot step on a sea urchin until a block covers it', () => {
    const lv = level({ urchin: [2] });
    expect(findPath(makeGrid(lv, []), lv.hero, lv.goal)).toBeNull();
  });

  it('floods the floor once the tide has risen', () => {
    const lv = level({ tide: { every: 2, max: 1 } });
    expect(findPath(makeGrid(lv, [], 1), { x: 0, y: 0 }, { x: 5, y: 0 })).not.toBeNull();
    expect(findPath(makeGrid(lv, [], 2), { x: 0, y: 0 }, { x: 5, y: 0 })).toBeNull();
  });

  it('opens the stone gate only while a block weighs down the plate', () => {
    const lv = level({ gate: { x: 3, h: 2, px: 1, py: 0 } });
    expect(findPath(makeGrid(lv, []), lv.hero, lv.goal)).toBeNull();
    const g = makeGrid(lv, [{ t: 'bridge', o: 0, x: 1, y: 0 }]);
    expect(g.gateOpen).toBe(true);
    expect(findPath(g, lv.hero, lv.goal)).not.toBeNull();
  });
});
