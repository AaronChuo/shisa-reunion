import { sfx } from '../audio/sfx';
import { backdrops, clampSpot, freeSpot, HOUSE_CAP, isDecor } from '../content/house';
import { getState, mut } from '../state/store';

// 西薩的家: putting things in the yard, moving them, putting them away, and changing the picture behind the house

/** Why something can't go in the house right now, or null when it can */
export function cannotPlace(id: string): 'full' | 'there' | 'roof' | 'unowned' | null {
  const p = getState().progress;
  if (p.pair.includes(id)) return 'roof';
  if (!isDecor(id) && !p.owned.includes(id)) return 'unowned';
  if (p.house.placed.some((s) => s.id === id)) return 'there';
  return p.house.placed.length >= HOUSE_CAP ? 'full' : null;
}

/** Puts something in the house where it was dropped, or hopping to a free spot in the yard; false when it can't go in */
export function putInHouse(id: string, at?: { x: number; y: number }): boolean {
  if (cannotPlace(id)) {
    sfx.bad();
    return false;
  }
  mut((s) => {
    const h = s.progress.house;
    h.placed.push({ id, ...(at ? clampSpot(id, at.x, at.y) : freeSpot(h.placed)) });
  });
  sfx.place(2);
  return true;
}

export function moveInHouse(id: string, x: number, y: number): void {
  mut((s) => {
    const it = s.progress.house.placed.find((p) => p.id === id);
    if (it) Object.assign(it, clampSpot(id, x, y));
  });
  sfx.place(1);
}

/** Back into the drawer */
export function putAway(id: string): void {
  mut((s) => {
    s.progress.house.placed = s.progress.house.placed.filter((p) => p.id !== id);
  });
  sfx.lift();
}

/** The picture behind the house; false while that zone hasn't been visited */
export function setBackdrop(id: string): boolean {
  const p = getState().progress;
  if (!backdrops(p.seen, p.clears).some((b) => b.open && b.id === id)) {
    sfx.bad();
    return false;
  }
  mut((s) => {
    s.progress.house.bd = id;
  });
  sfx.pop();
  return true;
}
