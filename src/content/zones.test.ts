import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allowed, learnedFor, lockHint, openFor, planRun, relax, STAGES, sceneUrl, stageCfg, TIERS, timeOfStop, ZONES } from './zones';

const zi = (id: string) => ZONES.findIndex((Z) => Z.id === id);
const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7717 + 3);

describe('planning a run', () => {
  it('keeps the first zone to plain building', () => {
    for (const seed of SEEDS.slice(0, 20)) expect(planRun(zi('naha'), [], seed)).toEqual([[], [], [], [], []]);
  });

  it('teaches the zone’s own element on the first stop and brings it back on the last', () => {
    for (const Z of ZONES.filter((z) => z.intro)) {
      const plan = planRun(zi(Z.id), [], 5);
      expect(plan[0]).toEqual([Z.intro]);
      expect(plan[4]).toContain(Z.intro);
    }
  });

  it('puts the new element on at least two of stops 2–4', () => {
    for (const Z of ZONES.filter((z) => z.intro))
      for (const seed of SEEDS) {
        const mid = planRun(zi(Z.id), ['ladder', 'urchin', 'spring', 'star', 'vine'], seed).slice(1, 4);
        expect(mid.filter((s) => s.includes(Z.intro as never)).length, `${Z.id} seed ${seed}`).toBeGreaterThanOrEqual(2);
      }
  });

  it('draws no more elements than the tier allows, only learned ones, and never a pair that may not meet', () => {
    const learned = ['ladder', 'urchin', 'spring', 'long', 'star', 'vine', 'slide', 'gate', 'tide'] as const;
    for (const Z of ZONES)
      for (const seed of SEEDS) {
        const plan = planRun(zi(Z.id), learned, seed);
        for (const set of plan.slice(1, 4)) {
          expect(set.length).toBeLessThanOrEqual(TIERS[Z.tier].counts.length - 1);
          for (const e of set) expect([Z.intro, ...learned] as string[]).toContain(e);
          expect(allowed(set), set.join('+')).toBe(true);
        }
        expect(allowed(plan[4]), `last stop ${plan[4].join('+')}`).toBe(true);
      }
  });

  it('adds learned elements to the last stop by tier', () => {
    const learned = ['ladder', 'urchin', 'spring', 'star'] as const;
    for (const seed of SEEDS.slice(0, 40)) {
      expect(planRun(zi('yomitan'), learned, seed)[4]).toEqual(['ladder']);
      expect(planRun(zi('kouri'), ['ladder', 'urchin'], seed)[4]).toHaveLength(2);
      // 大師: the new element and one learned one, so the last stop's extra difficulty comes from more blocks
      expect(planRun(zi('shuri'), learned, seed)[4]).toHaveLength(2);
    }
  });

  it('draws the same plan from the same seed', () => {
    expect(planRun(zi('shuri'), ['ladder', 'star'], 99)).toEqual(planRun(zi('shuri'), ['ladder', 'star'], 99));
  });

  it('turns up a mix of stops: some plain, some with one or two elements', () => {
    const sizes = new Set(
      SEEDS.flatMap((seed) =>
        planRun(zi('kouri'), ['ladder'], seed)
          .slice(1, 4)
          .map((s) => s.length),
      ),
    );
    expect([...sizes].sort()).toEqual([0, 1, 2]);
  });
});

describe('learned elements', () => {
  it('counts only finished zones of the same or a lower tier', () => {
    const clears = { naha: 1, yomitan: 1, kouri: 1, ishigaki: 1 };
    expect(learnedFor(zi('onna'), clears)).toEqual(['ladder', 'urchin']);
    expect(learnedFor(zi('yomitan'), clears)).toEqual([]);
    expect(learnedFor(zi('shuri'), clears)).toEqual(['ladder', 'urchin', 'star']);
  });
});

describe('opening zones', () => {
  it('opens the first tier from the start', () => {
    expect(openFor({})).toEqual(['naha']);
  });

  it('opens both 初級 zones after 那霸, and every 進階 zone once either of them is finished', () => {
    expect(openFor({ naha: 1 })).toEqual(['naha', 'chatan', 'yomitan']);
    const advanced = ['naha', 'chatan', 'yomitan', 'onna', 'motobu', 'kouri'];
    expect(openFor({ naha: 1, yomitan: 1 })).toEqual(advanced);
    expect(openFor({ naha: 1, chatan: 1 })).toEqual(advanced);
  });

  it('opens the next tier once all but one zone of a tier is finished', () => {
    // 進階 has three zones: two of them open 高手
    expect(openFor({ naha: 1, yomitan: 1, kouri: 1 })).not.toContain('yanbaru');
    expect(openFor({ naha: 1, yomitan: 1, kouri: 1, onna: 1 })).toEqual([
      'naha',
      'chatan',
      'yomitan',
      'onna',
      'motobu',
      'kouri',
      'yanbaru',
      'kaichu',
      'nakagusuku',
      'nanjo',
    ]);
    // 高手 has four: three of them open 大師
    const high = { naha: 1, yomitan: 1, kouri: 1, onna: 1, yanbaru: 1, kaichu: 1 };
    expect(openFor(high)).not.toContain('shuri');
    expect(openFor({ ...high, nanjo: 1 })).toEqual(expect.arrayContaining(['shuri', 'kumejima', 'miyako', 'ishigaki']));
  });

  it('says what is left to finish', () => {
    expect(lockHint(zi('yomitan'), {})).toBe('先走完那霸市才會打開');
    expect(lockHint(zi('yanbaru'), {})).toBe('走完 2 個進階地區才會打開');
    expect(lockHint(zi('yanbaru'), { kouri: 1 })).toBe('再走完 1 個進階地區才會打開');
    expect(lockHint(zi('shuri'), { kaichu: 1 })).toBe('再走完 2 個高手地區才會打開');
  });
});

describe('time of day', () => {
  it('turns from day to dusk to night along the stops, so the pair meets at night', () => {
    expect(Array.from({ length: STAGES }, (_, si) => timeOfStop(si))).toEqual(['day', 'day', 'dusk', 'dusk', 'night']);
  });

  it('paints every zone at all three times of day', () => {
    for (const Z of ZONES) for (const t of ['day', 'dusk', 'night'] as const) expect(existsSync(`public${sceneUrl(Z.id, t)}`), `${Z.id} ${t}`).toBe(true);
  });
});

describe('relaxing a stage', () => {
  const gate = stageCfg(zi('shuri'), 2, ['gate']);
  const tide = stageCfg(zi('kumejima'), 2, ['tide', 'star']);

  it('keeps every element and the block count until the ground has been narrowed', () => {
    for (const cfg of [gate, tide])
      for (const step of [1, 2, 3]) {
        const c = relax(cfg, step);
        expect([c.gate, c.tide, c.stars, c.k, c.must]).toEqual([cfg.gate, cfg.tide, cfg.stars, cfg.k, cfg.must]);
      }
  });

  it('narrows the ground by two columns on step 3, with fewer fixed blocks to match', () => {
    expect([relax(gate, 2).w, relax(gate, 3).w]).toEqual([10, 8]);
    expect(relax(gate, 3).obs).toEqual([0, 3]);
    const plain = stageCfg(zi('shuri'), 2, []);
    expect([plain.w, plain.obs]).toEqual([10, [3, 6]]);
    expect([relax(plain, 3).w, relax(plain, 3).obs]).toEqual([8, [1, 4]]);
  });

  it('never narrows the ground below the smallest zone', () => {
    expect(relax(stageCfg(zi('motobu'), 2, []), 3).w).toBe(6);
    expect(relax(stageCfg(zi('naha'), 2, []), 3).w).toBe(6);
  });

  it('drops elements on step 4 and a block on step 5', () => {
    expect([relax(tide, 4).tide, relax(tide, 4).stars, relax(gate, 4).gate, relax(gate, 4).k]).toEqual([null, 0, false, gate.k]);
    expect(relax(gate, 5).k).toBe(gate.k - 1);
  });
});
