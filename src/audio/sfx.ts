import { useGame } from '../state/store';
import { audioCtx, duckMusic, pluck, sanba, taiko } from './context';

// Sound effects played on the sanshin, with taiko drum and sanba clappers for accents.

/** Ryukyu scale (do mi fa sol ti), climbing as blocks are placed higher */
const RISE = ['C4', 'E4', 'F4', 'G4', 'B4', 'C5', 'E5'];

/** Current audio time, or null when sound effects are off or audio isn't running yet */
function at(): number | null {
  const ctx = audioCtx();
  if (ctx?.state !== 'running' || !useGame.getState().progress.sound) return null;
  return ctx.currentTime + 0.01;
}

export const sfx = {
  /** A block lands: a pluck that rises with the height it lands at, plus a light wooden knock */
  place(height = 0) {
    const t = at();
    if (t === null) return;
    pluck('sfx', 'classic', RISE[Math.min(Math.max(height, 0), RISE.length - 1)], t, 0.3, { vel: 0.9 });
    sanba('sfx', t, 0.35);
  },
  /** A block is picked up */
  lift() {
    const t = at();
    if (t === null) return;
    pluck('sfx', 'classic', 'C5', t, 0.12, { vel: 0.55, slide: -2 });
  },
  /** A stair is turned */
  rotate() {
    const t = at();
    if (t === null) return;
    sanba('sfx', t, 0.6);
  },
  /** Can't go there: the note sags down and the drum gives a soft thud */
  bad() {
    const t = at();
    if (t === null) return;
    pluck('sfx', 'classic', 'E4', t, 0.45, { vel: 0.8, bend: -3, bendTime: 0.25 });
    taiko('sfx', t, 0.35);
  },
  /** Bouncing off the clam: the note swoops up */
  boing() {
    const t = at();
    if (t === null) return;
    pluck('sfx', 'classic', 'G4', t, 0.45, { vel: 0.9, bend: 5, bendTime: 0.22 });
  },
  /** Climbing the ladder: three quick steps up */
  climb() {
    const t = at();
    if (t === null) return;
    ['E4', 'F4', 'G4'].forEach((n, i) => {
      pluck('sfx', 'classic', n, t + i * 0.09, 0.12, { vel: 0.6 });
    });
  },
  /** A luck coin: clapper rattle and two bright notes */
  coin() {
    const t = at();
    if (t === null) return;
    sanba('sfx', t, 0.9, 3);
    pluck('sfx', 'classic', 'C5', t + 0.02, 0.2, { vel: 0.8 });
    pluck('sfx', 'classic', 'E5', t + 0.1, 0.3, { vel: 0.9 });
  },
  /** The stone gate opens: two drum beats under a low note */
  gate() {
    const t = at();
    if (t === null) return;
    taiko('sfx', t, 0.9);
    taiko('sfx', t + 0.22, 0.6);
    pluck('sfx', 'classic', 'C4', t + 0.05, 0.9, { vel: 0.8 });
  },
  /** The tide rises: three notes sinking */
  tide() {
    const t = at();
    if (t === null) return;
    ['G4', 'E4', 'C4'].forEach((n, i) => {
      pluck('sfx', 'classic', n, t + i * 0.12, 0.2, { vel: 0.55 });
    });
  },
  /** Reunited: a Ryukyu-scale run up to a ringing do, with drum and clappers */
  win() {
    const t = at();
    if (t === null) return;
    duckMusic(2.4);
    ['C4', 'E4', 'F4', 'G4', 'B4'].forEach((n, i) => {
      pluck('sfx', 'classic', n, t + i * 0.085, 0.15, { vel: 0.85 });
    });
    pluck('sfx', 'classic', 'C5', t + 0.45, 1.2, { vel: 1, slide: -1 });
    taiko('sfx', t + 0.45, 0.9);
    sanba('sfx', t + 0.45, 1, 3);
    taiko('sfx', t + 0.9, 0.6);
  },
  /** The gacha crank turns */
  crank() {
    const t = at();
    if (t === null) return;
    for (let i = 0; i < 6; i++) sanba('sfx', t + i * 0.12, 0.7);
  },
  /** A capsule pops out or opens */
  pop() {
    const t = at();
    if (t === null) return;
    pluck('sfx', 'classic', 'C5', t, 0.25, { vel: 0.8, bend: 7, bendTime: 0.1 });
    sanba('sfx', t, 0.5);
  },
  /** Confirms the sound switch */
  hello() {
    const t = at();
    if (t === null) return;
    pluck('sfx', 'classic', 'G4', t, 0.2, { vel: 0.7 });
    pluck('sfx', 'classic', 'C5', t + 0.1, 0.3, { vel: 0.8 });
  },
};
