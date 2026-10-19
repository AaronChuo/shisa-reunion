import { useGame } from '../state/store';
import { driveCurve, ksSamples, noteFreq, PRESETS, type PresetKey } from './ks';

// One AudioContext with two buses: sound effects and background music, each switched on and off separately.
//   voices → bus (sfx | music) → master → speakers
//                  └→ reverb send → reverb → master
export type Bus = 'sfx' | 'music';

const LEVEL: Record<Bus, number> = { sfx: 1, music: 0.42 };
const REVERB_SEND: Record<Bus, number> = { sfx: 0.25, music: 0.6 };

let ac: AudioContext | null = null;
let master: GainNode;
let bus: Record<Bus, GainNode>;
/** Extra gain on the music bus for ducking under the win jingle and fading between songs */
let musicFade: GainNode;
let noiseBuf: AudioBuffer;
const chains = new Map<string, AudioNode>();
const percIns = new Map<Bus, AudioNode>();
const buffers = new Map<string, AudioBuffer>();
const stateListeners = new Set<() => void>();

export const audioCtx = (): AudioContext | null => ac;
export const audioRunning = (): boolean => ac?.state === 'running';
export const onAudioState = (fn: () => void): void => {
  stateListeners.add(fn);
};

function impulse(ctx: AudioContext, sec: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += 0.35 * (Math.random() * 2 - 1 - lp);
      d[i] = lp * (1 - i / len) ** 3;
    }
  }
  return b;
}

function build(ctx: AudioContext): void {
  master = ctx.createGain();
  master.connect(ctx.destination);
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 1.4);
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  verb.connect(wet).connect(master);
  musicFade = ctx.createGain();
  bus = { sfx: ctx.createGain(), music: ctx.createGain() };
  bus.sfx.connect(master);
  bus.music.connect(musicFade).connect(master);
  for (const b of ['sfx', 'music'] as Bus[]) {
    const send = ctx.createGain();
    send.gain.value = REVERB_SEND[b];
    (b === 'music' ? musicFade : bus.sfx).connect(send).connect(verb);
  }
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  applyLevels();
}

/** Follows the sound / music switches in saved progress */
export function applyLevels(): void {
  if (!ac) return;
  const p = useGame.getState().progress;
  bus.sfx.gain.setTargetAtTime(p.sound ? LEVEL.sfx : 0, ac.currentTime, 0.02);
  bus.music.gain.setTargetAtTime(p.music ? LEVEL.music : 0, ac.currentTime, 0.05);
}

/**
 * Creates or wakes the audio context. Only works inside a gesture the browser counts as user activation:
 * on touch screens that is the finger lifting (pointerup / touchend / click), not the finger going down.
 * With both switches off there is nothing to play, unless `forVoice`: a story read aloud on request.
 */
export function ensureAudio(forVoice = false): void {
  const p = useGame.getState().progress;
  if (!forVoice && !p.sound && !p.music) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const notify = () => {
      for (const fn of stateListeners) fn();
    };
    if (!ac && Ctx) {
      ac = new Ctx();
      build(ac);
      ac.onstatechange = notify;
      queueMicrotask(notify);
    }
    if (!ac || ac.state === 'running') return;
    ac.resume().then(notify, () => {});
    // iOS Safari only unlocks audio once something has actually played inside a gesture
    const blip = ac.createBufferSource();
    blip.buffer = ac.createBuffer(1, 1, 22050);
    blip.connect(ac.destination);
    blip.start(0);
  } catch {
    ac = null;
  }
}

/**
 * Keeps trying to start audio on every gesture until it runs. Stays installed because iOS suspends
 * audio again when the app goes to the background.
 */
export function installAudioUnlock(): () => void {
  const events = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
  const handler = () => {
    if (ac?.state !== 'running') ensureAudio();
  };
  for (const e of events) window.addEventListener(e, handler, { capture: true, passive: true });
  const unsub = useGame.subscribe((s, prev) => {
    if (s.progress.sound !== prev.progress.sound || s.progress.music !== prev.progress.music) applyLevels();
  });
  return () => {
    for (const e of events) window.removeEventListener(e, handler, { capture: true });
    unsub();
  };
}

/** Briefly lowers the music, e.g. under the win jingle */
export function duckMusic(seconds: number, to = 0.2): void {
  if (!ac) return;
  const t = ac.currentTime;
  musicFade.gain.cancelScheduledValues(t);
  musicFade.gain.setTargetAtTime(to, t, 0.05);
  musicFade.gain.setTargetAtTime(1, t + seconds, 0.3);
}

/** Where recorded narration plays: straight to the speakers, past the reverb and the sound and music switches */
export const voiceOut = (): AudioNode | null => (ac ? master : null);

/** Keeps the music quiet while something else needs the room (a story read aloud), until released */
export function holdMusicDown(on: boolean): void {
  if (!ac) return;
  const t = ac.currentTime;
  musicFade.gain.cancelScheduledValues(t);
  musicFade.gain.setTargetAtTime(on ? 0.15 : 1, t, on ? 0.08 : 0.4);
}

/** Fades the music out now and back in at `at`, so the old song's ringing notes don't overlap the new one */
export function musicCrossfade(at: number): void {
  if (!ac) return;
  const t = ac.currentTime;
  musicFade.gain.cancelScheduledValues(t);
  musicFade.gain.setTargetAtTime(0, t, 0.06);
  musicFade.gain.setTargetAtTime(1, at - 0.02, 0.02);
}

function chain(b: Bus, preset: PresetKey): AudioNode {
  const key = `${b}:${preset}`;
  const hit = chains.get(key);
  if (hit || !ac) return hit as AudioNode;
  const P = PRESETS[preset];
  const input = ac.createGain();
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 90;
  let node: AudioNode = input.connect(hp);
  for (const [f, g, q] of P.body) {
    const pk = ac.createBiquadFilter();
    pk.type = 'peaking';
    pk.frequency.value = f;
    pk.gain.value = g;
    pk.Q.value = q;
    node = node.connect(pk);
  }
  const shaper = ac.createWaveShaper();
  shaper.curve = driveCurve(P.drive) as Float32Array<ArrayBuffer>;
  shaper.oversample = '2x';
  const out = ac.createGain();
  out.gain.value = 0.55;
  node.connect(shaper).connect(out).connect(bus[b]);
  chains.set(key, input);
  return input;
}

function percIn(b: Bus): AudioNode {
  const hit = percIns.get(b);
  if (hit || !ac) return hit as AudioNode;
  const g = ac.createGain();
  g.gain.value = 0.4;
  g.connect(bus[b]);
  percIns.set(b, g);
  return g;
}

function buffer(preset: PresetKey, note: string): AudioBuffer | null {
  if (!ac) return null;
  const key = `${preset}:${note}`;
  let b = buffers.get(key);
  if (!b) {
    const data = ksSamples(noteFreq(note), PRESETS[preset], ac.sampleRate);
    b = ac.createBuffer(1, data.length, ac.sampleRate);
    b.getChannelData(0).set(data);
    buffers.set(key, b);
  }
  return b;
}

export interface PluckOptions {
  vel?: number;
  /** Start this many semitones off and slide to the note in 70 ms (negative = from below) */
  slide?: number;
  /** Bend away from the note by this many semitones over `bendTime` seconds */
  bend?: number;
  bendTime?: number;
}

/** One sanshin note at time t, damped after `len` seconds */
export function pluck(b: Bus, preset: PresetKey, note: string, t: number, len: number, o: PluckOptions = {}): void {
  const buf = buffer(preset, note);
  if (!ac || !buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  if (o.slide) {
    src.playbackRate.setValueAtTime(2 ** (o.slide / 12), t);
    src.playbackRate.linearRampToValueAtTime(1, t + 0.07);
  }
  if (o.bend) {
    src.playbackRate.setValueAtTime(1, t);
    src.playbackRate.exponentialRampToValueAtTime(2 ** (o.bend / 12), t + (o.bendTime ?? 0.2));
  }
  const g = ac.createGain();
  const end = t + Math.max(len, 0.12);
  g.gain.setValueAtTime(o.vel ?? 1, t);
  g.gain.setTargetAtTime(0.0001, end, PRESETS[preset].release);
  src.connect(g).connect(chain(b, preset));
  src.start(t);
  src.stop(end + 0.6);
}

function noise(t: number, dur: number, dest: AudioNode): void {
  if (!ac) return;
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  s.connect(dest);
  s.start(t);
  s.stop(t + dur);
}

/** Drum: skin pitched at 110–300 Hz so phone and laptop speakers can play it, plus the slap of the stick */
export function taiko(b: Bus, t: number, v: number): void {
  if (!ac) return;
  const dest = percIn(b);
  for (const [f0, f1, a] of [
    [180, 110, 1],
    [300, 210, 0.45],
  ]) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v * a, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.35);
  }
  const bp = ac.createBiquadFilter();
  const ng = ac.createGain();
  bp.type = 'bandpass';
  bp.frequency.value = 1100;
  bp.Q.value = 0.8;
  ng.gain.setValueAtTime(0.7 * v, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  bp.connect(ng).connect(dest);
  noise(t, 0.08, bp);
}

/** Sanba: three wooden clappers; `hits` quick knocks in a row */
export function sanba(b: Bus, t: number, v: number, hits = 1): void {
  if (!ac) return;
  const dest = percIn(b);
  for (let i = 0; i < hits; i++) {
    const tt = t + i * 0.06;
    for (const [f, q] of [
      [1700, 12],
      [3100, 14],
    ]) {
      const bp = ac.createBiquadFilter();
      const g = ac.createGain();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(3.2 * v, tt + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07);
      bp.connect(g).connect(dest);
      noise(tt, 0.012, bp);
    }
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.frequency.value = 2300;
    og.gain.setValueAtTime(0.0001, tt);
    og.gain.exponentialRampToValueAtTime(0.25 * v, tt + 0.001);
    og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.03);
    o.connect(og).connect(dest);
    o.start(tt);
    o.stop(tt + 0.04);
  }
}
