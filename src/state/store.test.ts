import { describe, expect, it } from 'vitest';
import { freshProgress, normalizeProgress } from './store';

describe('saved progress', () => {
  it('starts with only the first zone open', () => {
    expect(freshProgress().open).toEqual(['naha']);
  });

  it('upgrades a save from before the new islands without locking anything', () => {
    const old = { ...freshProgress(), open: undefined, unlocked: 3, clears: [2, 1, 1, 0] };
    const p = normalizeProgress(old);
    expect(p.clears).toMatchObject({ naha: 2, yomitan: 1, motobu: 1, shuri: 0, kouri: 0 });
    // Shuri stays open; finishing Yomitan opens every 進階 zone (one of three finished is not yet enough for 高手)
    expect(p.open).toEqual(['naha', 'chatan', 'yomitan', 'onna', 'motobu', 'kouri', 'shuri']);
  });

  it('opens zones by the tier rules for a save made with one zone opening at a time', () => {
    const p = normalizeProgress({ ...freshProgress(), open: ['naha', 'yomitan'], clears: { naha: 1, yomitan: 1 } });
    expect(p.open).toEqual(['naha', 'chatan', 'yomitan', 'onna', 'motobu', 'kouri']);
  });

  it('moves a journey in progress to its zone in the new order', () => {
    const run = {
      zi: 3,
      si: 2,
      phase: 'play',
      level: { w: 7, fixed: [], hero: { x: 0, y: 0 }, goal: { x: 6, y: 0 }, inv: [], urchin: [], tide: null, gate: null },
    };
    const p = normalizeProgress({ ...freshProgress(), unlocked: 3, clears: [1, 1, 1, 0], run });
    expect(p.run?.zone).toBe('shuri');
    expect(p.run?.zi).toBe(10);
    expect(p.run?.level?.stars).toEqual([]);
    // Runs saved before stops had planned elements get a plan, which starts with Shuri's lesson on the stone gate
    expect(p.run?.plan).toHaveLength(5);
    expect(p.run?.plan[0]).toEqual(['gate']);
  });

  it('hands 竹富島 and 西表島 on to 石垣島 and 山原, which took over their star sand and vines', () => {
    const run = { zone: 'taketomi', zi: 5, si: 2, phase: 'play', plan: [['star'], [], ['star'], ['star'], ['star']], level: null };
    const p = normalizeProgress({
      ...freshProgress(),
      open: ['naha', 'yomitan', 'motobu', 'kouri', 'nakagusuku', 'taketomi', 'iriomote', 'miyako'],
      clears: { naha: 1, yomitan: 1, kouri: 1, nakagusuku: 1, taketomi: 2, iriomote: 1 },
      run,
    });
    expect(p.clears).toMatchObject({ ishigaki: 2, yanbaru: 1 });
    expect(p.clears).not.toHaveProperty('taketomi');
    // Zones never close: Miyako and Ishigaki stay open though 大師 is not reached yet
    expect(p.open).toEqual(expect.arrayContaining(['yanbaru', 'nakagusuku', 'miyako', 'ishigaki']));
    expect(p.open).not.toContain('taketomi');
    expect([p.run?.zone, p.run?.zi, p.run?.si]).toEqual(['ishigaki', 13, 2]);
  });

  it('lets go of the scenery roads a journey picked, now that each stop has its own time of day', () => {
    const run = { zone: 'naha', zi: 0, si: 3, phase: 'play', plan: [[], [], [], [], []], road: [null, null, 2, null, null], level: null };
    const p = normalizeProgress({ ...freshProgress(), run });
    expect(p.run).not.toHaveProperty('road');
    expect([p.run?.zone, p.run?.si]).toEqual(['naha', 3]);
  });

  it('drops a journey whose zone no longer exists', () => {
    expect(normalizeProgress({ ...freshProgress(), run: { zone: 'atlantis', zi: 0, si: 0 } }).run).toBeNull();
  });
});
