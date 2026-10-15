import { useGame } from '../state/store';

// Tiny synthesized sound effects. Audio starts only after the first user gesture (browser rule).
let ac: AudioContext | null = null;

const soundOn = () => useGame.getState().progress.sound;

export function ensureAudio(): void {
  if (!soundOn()) return;
  try {
    if (!ac) ac = new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
  } catch {
    ac = null;
  }
}

function tone(f: number, d: number, type: OscillatorType = 'triangle', v = 0.12, wait = 0, f2?: number): void {
  if (!soundOn() || !ac) return;
  try {
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
