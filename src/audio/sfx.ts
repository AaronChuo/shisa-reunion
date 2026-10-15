import { useGame } from '../state/store';

// Tiny synthesized sound effects. Audio starts only after the first user gesture (browser rule).
let ac: AudioContext | null = null;

const soundOn = () => useGame.getState().progress.sound;

const wake = (ctx: AudioContext) => {
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
};

/**
 * Creates or wakes the audio context. Only works inside a gesture the browser counts as user activation:
 * on touch screens that is the finger lifting (pointerup / touchend / click), not the finger going down.
 */
export function ensureAudio(): void {
  if (!soundOn()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ac && Ctx) ac = new Ctx();
    if (!ac || ac.state === 'running') return;
    wake(ac);
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
  return () => {
    for (const e of events) window.removeEventListener(e, handler, { capture: true });
  };
}

function tone(f: number, d: number, type: OscillatorType = 'triangle', v = 0.12, wait = 0, f2?: number): void {
  if (!soundOn() || !ac) return;
  try {
    wake(ac);
    const t = ac.currentTime + wait;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  } catch {
    // audio is optional
  }
}

/** Ryukyu scale: do mi fa sol ti do */
const RYUKYU = [523, 659, 698, 784, 988, 1047];

export const sfx = {
  place() {
    tone(392, 0.12, 'triangle', 0.14);
    tone(587, 0.1, 'sine', 0.07, 0.05);
  },
  lift() {
    tone(700, 0.07, 'sine', 0.08);
  },
  bad() {
    tone(200, 0.16, 'square', 0.04);
    tone(150, 0.2, 'square', 0.04, 0.08);
  },
  boing() {
    tone(220, 0.3, 'sine', 0.13, 0, 660);
  },
  climb() {
    tone(880, 0.05, 'sine', 0.05);
  },
  coin() {
    tone(1319, 0.08, 'square', 0.05);
    tone(1760, 0.18, 'square', 0.05, 0.07);
  },
  gate() {
    tone(130, 0.4, 'sawtooth', 0.05, 0, 90);
  },
  win() {
    RYUKYU.forEach((f, i) => {
      tone(f, 0.3, 'triangle', 0.12, i * 0.11);
    });
  },
  crank() {
    for (let i = 0; i < 6; i++) tone(300 + i * 40, 0.05, 'square', 0.04, i * 0.12);
  },
  pop() {
    tone(500, 0.15, 'sine', 0.12, 0, 1200);
  },
};
