import { describe, expect, it } from 'vitest';
import { type GenConfig, generate } from '../engine';
import { drawFromSeries, VARIANTS } from './shisa';
import { relax, stageCfg } from './zones';

// Every element combination is generated in generation.sweep.test.ts (`pnpm test:gen`)
describe('level generation', () => {
  it('reproduces the same level from the same seed', () => {
    const cfg = stageCfg(3, 0, ['spring']);
    expect(generate(cfg, 42, relax)).toEqual(generate(cfg, 42, relax));
  });

  it('keeps relaxing a stage it cannot make, up to the fifth step', { timeout: 5000 }, () => {
    // No blocks to draw the tray from: nothing can be made until relax hands back a stage that can
    const stuck = { ...stageCfg(0, 0, []), pool: {} };
    const steps: number[] = [];
    const ease = (_: GenConfig, step: number) => {
      steps.push(step);
      return step < 5 ? stuck : stageCfg(0, 0, []);
    };
    // A clock that jumps a second each time it is read, so every few tries count as a failed step
    let t = 0;
    const now = () => {
      t += 1000;
      return t;
    };
    const lv = generate(stuck, 1, ease, { now });
    expect(steps).toEqual([1, 2, 3, 4, 5]);
    expect(lv.inv.length).toBeGreaterThan(0);
  });
});

describe('gacha draw', () => {
  it('never returns a shisa the player already owns', () => {
    const owned = VARIANTS.filter((v) => v.series === 'sea')
      .slice(0, 4)
      .map((v) => v.id);
    for (let i = 0; i < 50; i++) expect(owned).not.toContain(drawFromSeries('sea', owned)?.id);
  });

  it('returns nothing once a series is complete', () => {
    const owned = VARIANTS.filter((v) => v.series === 'fest').map((v) => v.id);
    expect(drawFromSeries('fest', owned)).toBeNull();
  });
});
