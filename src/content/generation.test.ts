import { describe, expect, it } from 'vitest';
import { generate } from '../engine';
import { drawFromSeries, VARIANTS } from './shisa';
import { relax, stageCfg } from './zones';

// Every element combination is generated in generation.sweep.test.ts (`pnpm test:gen`)
describe('level generation', () => {
  it('reproduces the same level from the same seed', () => {
    const cfg = stageCfg(3, 0, ['spring']);
    expect(generate(cfg, 42, relax)).toEqual(generate(cfg, 42, relax));
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
