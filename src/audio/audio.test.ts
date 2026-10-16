import { describe, expect, it } from 'vitest';
import { ZONES } from '../content/zones';
import { ksSamples, midiOf, noteFreq, PRESETS } from './ks';
import { HOME_SONG, PERC, SHOP_SONG, SONGS } from './songs';

const SR = 44100;

/** Fundamental frequency of a rendered pluck, found by autocorrelation with parabolic interpolation */
function pitchOf(samples: Float32Array, approx: number): number {
  const seg = samples.subarray(2000, 2000 + 4096);
  const lo = Math.floor((SR / approx) * 0.8);
  const hi = Math.ceil((SR / approx) * 1.25);
  const ac = (lag: number) => {
    let s = 0;
    let e0 = 0;
    let e1 = 0;
    for (let i = 0; i + lag < seg.length; i++) {
      s += seg[i] * seg[i + lag];
      e0 += seg[i] * seg[i];
      e1 += seg[i + lag] * seg[i + lag];
    }
    return s / Math.sqrt(e0 * e1);
  };
  let best = lo;
  for (let lag = lo; lag <= hi; lag++) if (ac(lag) > ac(best)) best = lag;
  const [a, b, c] = [ac(best - 1), ac(best), ac(best + 1)];
  const shift = (0.5 * (a - c)) / (a - 2 * b + c);
  return SR / (best + shift);
}

describe('sanshin synthesis', () => {
  for (const preset of Object.keys(PRESETS) as (keyof typeof PRESETS)[]) {
    it.each(['G3', 'C4', 'G4', 'C5', 'F5'])(`stays within 3 cents of %s with the ${preset} preset`, (note) => {
      const f = noteFreq(note);
      const got = pitchOf(ksSamples(f, PRESETS[preset], SR), f);
      expect(Math.abs(1200 * Math.log2(got / f))).toBeLessThan(3);
    });
  }

  it('renders a pluck that starts loud and fades out', () => {
    const s = ksSamples(noteFreq('C4'), PRESETS.classic, SR);
    const rms = (a: number, b: number) => Math.sqrt(s.subarray(a, b).reduce((x, v) => x + v * v, 0) / (b - a));
    expect(rms(0, 4410)).toBeGreaterThan(rms(s.length - 8820, s.length - 4410) * 4);
  });
});

describe('background music', () => {
  it.each(Object.entries(SONGS))('has whole bars and playable notes in %s', (_, song) => {
    expect(song.beats % 4).toBe(0);
    expect(song.events.length).toBeGreaterThan(8);
    for (const ev of song.events) {
      expect(ev.len).toBeGreaterThan(0);
      expect(midiOf(ev.note)).toBeGreaterThanOrEqual(midiOf('G3'));
      expect(midiOf(ev.note)).toBeLessThanOrEqual(midiOf('G5'));
    }
  });

  it('gives every zone, the map and the shop screens a song', () => {
    for (const id of [HOME_SONG, SHOP_SONG, ...ZONES.map((z) => z.bgm)]) expect(SONGS[id]).toBeDefined();
    expect(new Set(ZONES.map((z) => z.bgm)).size).toBe(ZONES.length);
  });

  it('places percussion inside the bar', () => {
    for (const hits of Object.values(PERC)) {
      for (const [beat] of hits) {
        expect(beat).toBeGreaterThanOrEqual(0);
        expect(beat).toBeLessThan(4);
      }
    }
  });
});
