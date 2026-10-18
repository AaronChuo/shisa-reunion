import { describe, expect, it } from 'vitest';
import { canLift, findPath, findRoute, fits, makeGrid, restY, solve, stable } from '.';
import type { Level, Placement } from './types';

const level = (over: Partial<Level>): Level => ({
  w: 6,
  fixed: [],
  hero: { x: 0, y: 0 },
  goal: { x: 5, y: 0 },
  inv: [],
  urchin: [],
  stars: [],
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

  it('holds the long stone bridge up only when both ends rest on something', () => {
    const middle = makeGrid(level({ fixed: [{ t: 'tower', o: 0, x: 2, y: 0 }], hero: { x: 0, y: 0 }, goal: { x: 5, y: 0 } }), []);
    expect(stable(middle, 'long', 0, 1, 2)).toBe(false);
    const ends = makeGrid(
      level({
        fixed: [
          { t: 'tower', o: 0, x: 1, y: 0 },
          { t: 'tower', o: 0, x: 3, y: 0 },
        ],
        hero: { x: 0, y: 0 },
        goal: { x: 5, y: 0 },
      }),
      [],
    );
    expect(stable(ends, 'long', 0, 1, 2)).toBe(true);
    expect(stable(ends, 'long', 0, 2, 2)).toBe(false);
    expect(stable(middle, 'long', 0, 2, 0)).toBe(true);
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

describe('slides', () => {
  const placed: Placement[] = [{ t: 'slide', o: 0, x: 1, y: 0 }];
  const fixed: Placement[] = [{ t: 'cube', o: 0, x: 0, y: 0 }];

  it('carries the hero downhill from the platform to the floor', () => {
    const lv = level({ fixed, hero: { x: 0, y: 1 }, goal: { x: 5, y: 0 } });
    const path = findPath(makeGrid(lv, placed), lv.hero, lv.goal);
    expect(path?.some((p) => p.via === 'slide')).toBe(true);
  });

  it('never lets anyone climb back up', () => {
    const lv = level({ fixed, hero: { x: 5, y: 0 }, goal: { x: 0, y: 1 } });
    expect(findPath(makeGrid(lv, placed), lv.hero, lv.goal)).toBeNull();
  });
});

describe('vines', () => {
  // A block floating at (2, 3) stands in for any block with open space beneath it
  const roof: Placement = { t: 'cube', o: 0, x: 2, y: 3 };

  it('hangs from the underside of a block and nowhere else', () => {
    const g = makeGrid(level({}), [roof]);
    expect(stable(g, 'vine', 0, 2, 1)).toBe(true);
    expect(stable(g, 'vine', 0, 2, 0)).toBe(false);
    expect(stable(g, 'vine', 0, 4, 1)).toBe(false);
    expect(restY(g, 'vine', 0, 2, 0)).toBe(1);
  });

  it('lets the hero climb up from the floor and step onto a ledge', () => {
    const lv = level({ fixed: [{ t: 'tower', o: 0, x: 3, y: 0 }], hero: { x: 0, y: 0 }, goal: { x: 3, y: 2 } });
    const path = findPath(makeGrid(lv, [roof, { t: 'vine', o: 0, x: 2, y: 1 }]), lv.hero, lv.goal);
    expect(path?.filter((p) => p.via === 'hang').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the block a vine hangs from in place', () => {
    const placed: Placement[] = [roof, { t: 'vine', o: 0, x: 2, y: 1 }];
    expect(canLift(level({}), placed, 0)).toBe(false);
    expect(canLift(level({}), placed, 1)).toBe(true);
  });
});

describe('star sand', () => {
  it('sends the hero over every star before the goal', () => {
    const lv = level({
      hero: { x: 0, y: 0 },
      goal: { x: 5, y: 0 },
      stars: [
        { x: 1, y: 0 },
        { x: 4, y: 0 },
      ],
    });
    const route = findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars);
    const xs = route?.map((p) => p.s.x) ?? [];
    expect(xs).toContain(1);
    expect(xs).toContain(4);
    expect(xs[xs.length - 1]).toBe(5);
  });

  it('keeps blocks from burying a star', () => {
    const lv = level({ stars: [{ x: 2, y: 0 }] });
    expect(fits(makeGrid(lv, []), 'cube', 0, 2, 0)).toBe(false);
  });

  it('refuses a route that has to walk through the goal to reach a star', () => {
    const lv = level({ hero: { x: 0, y: 0 }, goal: { x: 3, y: 0 }, stars: [{ x: 5, y: 0 }] });
    expect(findRoute(makeGrid(lv, []), lv.hero, lv.goal, lv.stars)).toBeNull();
  });
});
