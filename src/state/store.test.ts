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
    // Shuri stays open and Kouri, the new island after Motobu, opens because Motobu was finished
    expect(p.open).toEqual(['naha', 'yomitan', 'motobu', 'kouri', 'shuri']);
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
    expect(p.run?.zi).toBe(6);
    expect(p.run?.level?.stars).toEqual([]);
  });

  it('drops a journey whose zone no longer exists', () => {
    expect(normalizeProgress({ ...freshProgress(), run: { zone: 'atlantis', zi: 0, si: 0 } }).run).toBeNull();
  });
});
