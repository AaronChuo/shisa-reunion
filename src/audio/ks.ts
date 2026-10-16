// Karplus-Strong plucked string tuned to sound like a sanshin. Pure functions: no AudioContext, so they can be tested.

export interface Preset {
  /** Loop low-pass strength: higher = brighter string */
  damp: number;
  /** Energy kept per trip around the loop: higher = longer ring */
  loss: number;
  /** Where the bachi strikes, as a share of the string: small = near the bridge, brighter */
  pos: number;
  /** Level of the bachi "click" at the start */
  click: number;
  /** Rendered length in seconds */
  dur: number;
  /** How fast a note is damped when the next one comes (time constant, seconds) */
  release: number;
  /** Soft-clip drive for the snakeskin buzz */
  drive: number;
  /** Snakeskin body resonances: [frequency, gain dB, Q] */
  body: [number, number, number][];
}

export const PRESETS = {
  classic: {
    damp: 0.55,
    loss: 0.9935,
    pos: 0.12,
    click: 0.35,
    dur: 1.6,
    release: 0.07,
    drive: 1.8,
    body: [
      [260, 6, 1.2],
      [1350, 4, 2],
      [3100, 6, 3],
    ],
  },
  soft: {
    damp: 0.32,
    loss: 0.9965,
    pos: 0.24,
    click: 0.12,
    dur: 2.1,
    release: 0.1,
    drive: 1.15,
    body: [
      [240, 5, 1.1],
      [1200, 2, 1.6],
      [2800, 2, 2.5],
    ],
  },
} satisfies Record<string, Preset>;

export type PresetKey = keyof typeof PRESETS;

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** MIDI note number of a name like "C4" or "G#3" */
export function midiOf(name: string): number {
  const m = /^([A-G])(#?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] ? 1 : 0);
}

export const noteFreq = (name: string): number => 440 * 2 ** ((midiOf(name) - 69) / 12);

/**
 * Renders one pluck. A burst of noise one period long circulates through a delay line; a one-pole low-pass in
 * the loop makes high harmonics fade first, the way a real string does. The delay is fractional (linear
 * interpolation, minus the filter's own delay) so every note stays in tune.
 */
export function ksSamples(freq: number, P: Preset, sampleRate: number): Float32Array {
  const len = Math.floor(sampleRate * P.dur);
  const out = new Float32Array(len);
  // The loop's low-pass delays the signal too; subtract its exact phase delay at this note's frequency
  const w = (2 * Math.PI * freq) / sampleRate;
  const lpDelay = Math.atan2((1 - P.damp) * Math.sin(w), 1 - (1 - P.damp) * Math.cos(w)) / w;
  const N = sampleRate / freq - lpDelay;
  // Integer delay line plus a first-order all-pass for the fraction (keeps the fraction in [0.2, 1.2) for accuracy)
  let Nint = Math.floor(N - 0.2);
  const frac = N - Nint;
  const c = (1 - frac) / (1 + frac);
  Nint = Math.max(1, Nint);
  const L = Nint + 2;
  const line = new Float32Array(L);
  let seed = Math.round(freq * 977) || 1;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };
  const E = Math.max(2, Math.round(N));
  const exc = new Float32Array(E);
  for (let i = 0; i < E; i++) exc[i] = rnd();
  // Comb filter for the pluck position: striking near the bridge keeps more high harmonics
  const p0 = Math.max(1, Math.round(E * P.pos));
  for (let i = E - 1; i >= p0; i--) exc[i] -= exc[i - p0];
  let lp = 0;
  let apIn = 0;
  let apOut = 0;
  for (let t = 0; t < len; t++) {
    const x = line[(((t - Nint) % L) + L) % L];
    const ap = c * x + apIn - c * apOut;
    apIn = x;
    apOut = ap;
    lp += P.damp * (ap - lp);
    const y = (t < E ? exc[t] * 0.8 : 0) + P.loss * lp;
    line[t % L] = y;
    out[t] = y;
  }
  // The bachi: a few milliseconds of high-passed noise
  const clickLen = Math.floor(sampleRate * 0.004);
  let prev = 0;
  for (let t = 0; t < clickLen; t++) {
    const n = rnd();
    out[t] += P.click * (n - prev) * (1 - t / clickLen);
    prev = n;
  }
  let peak = 0;
  for (let t = 0; t < len; t++) peak = Math.max(peak, Math.abs(out[t]));
  const fade = Math.floor(sampleRate * 0.05);
  for (let t = 0; t < len; t++) out[t] = (out[t] / (peak || 1)) * 0.8 * (t > len - fade ? (len - t) / fade : 1);
  return out;
}

/** Curve for a WaveShaper: tanh soft clipping normalised to ±1 */
export function driveCurve(k: number): Float32Array {
  const n = 1024;
  const c = new Float32Array(n);
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) c[i] = Math.tanh(k * ((i / (n - 1)) * 2 - 1)) / norm;
  return c;
}
