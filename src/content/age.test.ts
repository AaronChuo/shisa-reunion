import { describe, expect, it } from 'vitest';
import { AGES, ageOf, handOut } from './age';

describe('hint shells and rerolls by who is playing', () => {
  it('gives the youngest twice as many hints as blocks on every stop, and rerolls without end', () => {
    expect(handOut(AGES.little, 0, 3, 1)).toEqual({ shell: 6, conch: null });
    expect(handOut(AGES.little, 4, 5, 5)).toEqual({ shell: 10, conch: null });
  });

  it('gives 6–11 as many hints as blocks and two rerolls on every stop', () => {
    expect(handOut(AGES.kid, 0, 3, 2)).toEqual({ shell: 3, conch: 2 });
    expect(handOut(AGES.kid, 3, 4, 2)).toEqual({ shell: 4, conch: 2 });
  });

  it('gives 12 and up as many hints as the zone’s stars and two rerolls for the whole journey', () => {
    expect(handOut(AGES.big, 0, 3, 4)).toEqual({ shell: 4, conch: 2 });
    for (let si = 1; si < 5; si++) expect(handOut(AGES.big, si, 3, 4)).toBeNull();
  });

  it('helps as for the youngest until someone has chosen', () => {
    expect(ageOf(null)).toBe(AGES.little);
  });
});
