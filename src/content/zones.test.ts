import { describe, expect, it } from 'vitest';
import { allowed, isBranch, learnedFor, lockHint, openFor, planRun, roadOffer, STAGES, TIERS, ZONES } from './zones';

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
        planRun(zi('motobu'), ['ladder'], seed)
          .slice(1, 4)
          .map((s) => s.length),
      ),
    );
    expect([...sizes].sort()).toEqual([0, 1, 2]);
  });
});

describe('learned elements', () => {
  it('counts only finished zones of the same or a lower tier', () => {
    const clears = { naha: 1, yomitan: 1, motobu: 1, taketomi: 1 };
    expect(learnedFor(zi('kouri'), clears)).toEqual(['ladder', 'urchin']);
    expect(learnedFor(zi('yomitan'), clears)).toEqual([]);
    expect(learnedFor(zi('shuri'), clears)).toEqual(['ladder', 'urchin', 'star']);
  });
});

describe('opening zones', () => {
  it('opens the first tier from the start', () => {
    expect(openFor({})).toEqual(['naha']);
  });

  it('opens every 進階 zone at once when 初級 is finished', () => {
    expect(openFor({ naha: 1 })).toEqual(['naha', 'yomitan']);
    expect(openFor({ naha: 1, yomitan: 1 })).toEqual(['naha', 'yomitan', 'motobu', 'kouri', 'nakagusuku']);
  });

  it('opens the next tier once all but one zone of a tier is finished', () => {
    // 進階 has three zones: two of them open 高手
    expect(openFor({ naha: 1, yomitan: 1, kouri: 1 })).not.toContain('taketomi');
    expect(openFor({ naha: 1, yomitan: 1, kouri: 1, nakagusuku: 1 })).toEqual([
      'naha',
      'yomitan',
      'motobu',
      'kouri',
      'nakagusuku',
      'taketomi',
      'iriomote',
      'miyako',
    ]);
    expect(openFor({ naha: 1, yomitan: 1, kouri: 1, nakagusuku: 1, iriomote: 1, miyako: 1 })).toEqual(expect.arrayContaining(['shuri', 'kumejima']));
  });

  it('says what is left to finish', () => {
    expect(lockHint(zi('yomitan'), {})).toBe('先走完那霸市才會打開');
    expect(lockHint(zi('taketomi'), {})).toBe('走完 2 個進階地區才會打開');
    expect(lockHint(zi('taketomi'), { kouri: 1 })).toBe('再走完 1 個進階地區才會打開');
  });
});

describe('scenery roads', () => {
  it('gives every zone three named roads, one for each time of day', () => {
    for (const Z of ZONES) {
      expect(Z.roads, Z.id).toHaveLength(3);
      expect(new Set(Z.roads.map((r) => r.time)), Z.id).toEqual(new Set(['day', 'dusk', 'night']));
      for (const r of Z.roads) expect(r.name.length, Z.id).toBeGreaterThan(1);
    }
  });

  it('offers one choice in 入門, 初級 and 進階, two in 高手 and three in 大師, never on the first or last stop', () => {
    const count = (zi: number) => Array.from({ length: STAGES }, (_, si) => si).filter((si) => isBranch(zi, si)).length;
    expect(ZONES.map((_, zi) => count(zi))).toEqual(ZONES.map((Z) => [1, 1, 1, 2, 3][Z.tier]));
    for (let zi = 0; zi < ZONES.length; zi++) {
      expect(isBranch(zi, 0)).toBe(false);
      expect(isBranch(zi, STAGES - 1)).toBe(false);
    }
  });

  it('offers two different roads, the same ones for the same seed', () => {
    for (const seed of SEEDS.slice(0, 50))
      for (const si of [1, 2, 3]) {
        const [a, b] = roadOffer(0, si, seed);
        expect(a).not.toBe(b);
        expect([a, b].every((i) => i >= 0 && i < 3)).toBe(true);
        expect(roadOffer(0, si, seed)).toEqual([a, b]);
      }
  });
});
