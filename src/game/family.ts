import type { Age } from '../content/age';
import { getState, mut } from '../state/store';

// The grown-ups' side of the game: who is playing.

/** A grown-up picks who is playing */
export function chooseAge(age: Age): void {
  mut((s) => {
    s.progress.age = age;
    if (s.ui.modal?.kind === 'age') s.ui.modal = null;
  });
}

export function openParents(): void {
  mut((s) => {
    s.ui.modal = { kind: 'parents' };
  });
}

/** Asked once, on the map, when nobody has said yet who is playing */
export function askAgeIfNeeded(): void {
  const { progress: p, ui } = getState();
  if (p.age === null && ui.screen === 'home' && !ui.modal && !ui.story) {
    mut((s) => {
      s.ui.modal = { kind: 'age' };
    });
  }
}
