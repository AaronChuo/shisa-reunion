import { speak } from '../audio/speech';
import { AGES, type Age } from '../content/age';
import { SHISA_REST } from '../content/story';
import { getState, mut, type Progress } from '../state/store';
import { goHome, openStory } from './actions';

// The grown-ups' side of the game: who is playing, and a gentle reminder to rest after a while.

/** Play time since the last rest, counted while the game is on screen (kept out of the store: it changes constantly) */
let playMs = 0;

/** A grown-up picks who is playing; the rest reminder follows the age until they change it */
export function chooseAge(age: Age): void {
  playMs = 0;
  mut((s) => {
    s.progress.age = age;
    s.progress.restMin = AGES[age].restMin;
    if (s.ui.modal?.kind === 'age') s.ui.modal = null;
  });
}

/** The answer to the question asked the first time the game opens; a new player then sees the opening story */
export function answerAge(age: Age): void {
  chooseAge(age);
  if (!getState().progress.seen.includes('story')) openStory();
}

export function setRestMin(min: number | null): void {
  playMs = 0;
  mut((s) => {
    s.progress.restMin = min;
  });
}

/** Replaces this device's progress with a backup's, once a grown-up has confirmed it; back to the map */
export function restoreProgress(p: Progress): void {
  playMs = 0;
  mut((s) => {
    s.progress = p;
    s.ui.modal = null;
  });
  goHome();
}

export function openParents(): void {
  mut((s) => {
    s.ui.modal = { kind: 'parents' };
  });
}

/** Asked once, when nobody has said yet who is playing: before the opening story for a new player, on the map for an older save */
export function askAgeIfNeeded(): void {
  const { progress: p, ui } = getState();
  if (p.age === null && ui.screen === 'home' && !ui.modal && !ui.story) {
    mut((s) => {
      s.ui.modal = { kind: 'age' };
    });
  }
}

// ---------- rest reminder ----------

const TICK_MS = 5000;
/** Away from the game this long counts as a rest already */
const AWAY_RESETS_MS = 10 * 60_000;

export const restDue = (): boolean => {
  const min = getState().progress.restMin;
  return min !== null && playMs >= min * 60_000;
};

function remind(): void {
  mut((s) => {
    s.ui.modal = { kind: 'rest' };
  });
  if (getState().progress.sound) speak(SHISA_REST, undefined, 'shisa');
}

/**
 * Between stops (after the coin) is one natural break; the map, the collection and an idle gacha machine are the
 * others. Never in the middle of building a road.
 */
export function remindAtBreak(): boolean {
  const { ui } = getState();
  if (!restDue() || ui.modal || ui.busy || ui.story) return false;
  if (ui.screen === 'play' || (ui.screen === 'gacha' && ui.pull !== 'idle')) return false;
  remind();
  return true;
}

/** After the coin of a stop that is not the last: rest now instead of the next-stop card, if it is time */
export function restBetweenStops(): boolean {
  if (!restDue()) return false;
  remind();
  return true;
}

/** "OK": back to the map with the clock started again; the journey waits where it was */
export function ackRest(): void {
  playMs = 0;
  mut((s) => {
    s.ui.modal = null;
  });
  goHome();
}

/** Mount once: counts play time while the game is on screen, and checks for a natural break to remind */
export function installPlayClock(): () => void {
  let last = Date.now();
  let hiddenAt: number | null = null;
  const tick = () => {
    const now = Date.now();
    if (!document.hidden) {
      playMs += now - last;
      remindAtBreak();
    }
    last = now;
  };
  const onVis = () => {
    if (document.hidden) {
      tick();
      hiddenAt = Date.now();
    } else {
      if (hiddenAt !== null && Date.now() - hiddenAt >= AWAY_RESETS_MS) playMs = 0;
      hiddenAt = null;
      last = Date.now();
    }
  };
  const t = window.setInterval(tick, TICK_MS);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.clearInterval(t);
    document.removeEventListener('visibilitychange', onVis);
  };
}
