import type { CellKind, PieceCell, PieceType } from './types';

/** Board height in cells */
export const H = 5;

export const MASS: Record<CellKind, number> = { solid: 1, stairR: 0.5, stairL: 0.5, arch: 0.6, ladder: 0.4, spring: 0.8, slideR: 0.5, slideL: 0.5, vine: 0.3 };

/** Flat tops that other pieces can rest on */
export const SUPPORT = new Set<string>(['solid', 'arch', 'ladder']);
/** Flat tops a character can stand on */
export const STAND = new Set<string>(['solid', 'arch', 'ladder', 'spring']);
/** Cells a character can occupy */
export const OPEN = new Set<string>(['char', 'arch', 'ladder', 'gateOpen', 'vine']);
/** Cells with a flat underside that a vine can hang from */
export const HANG_FROM = new Set<string>(['solid', 'stairR', 'stairL', 'slideR', 'slideL']);

export const DEFS: Record<PieceType, { orients: PieceCell[][] }> = {
  cube: { orients: [[[0, 0, 'solid']]] },
  tower: {
    orients: [
      [
        [0, 0, 'solid'],
        [0, 1, 'solid'],
      ],
    ],
  },
  stair: {
    orients: [
      [
        [0, 0, 'stairR'],
        [1, 0, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [0, 1, 'stairR'],
      ],
      [
        [0, 0, 'solid'],
        [0, 1, 'stairL'],
      ],
      [
        [0, 0, 'solid'],
        [1, 0, 'stairL'],
      ],
    ],
  },
  bridge: { orients: [[[0, 0, 'arch']]] },
  ladder: {
    orients: [
      [
        [0, 0, 'ladder'],
        [0, 1, 'ladder'],
      ],
    ],
  },
  spring: { orients: [[[0, 0, 'spring']]] },
  long: {
    orients: [
      [
        [0, 0, 'solid'],
        [1, 0, 'arch'],
        [2, 0, 'solid'],
      ],
    ],
  },
  // A platform with a slope running down from it
  slide: {
    orients: [
      [
        [0, 0, 'solid'],
        [1, 0, 'slideR'],
      ],
      [
        [0, 0, 'slideL'],
        [1, 0, 'solid'],
      ],
    ],
  },
  vine: {
    orients: [
      [
        [0, 0, 'vine'],
        [0, 1, 'vine'],
      ],
    ],
  },
};

export const cellsOf = (t: PieceType, o: number): PieceCell[] => DEFS[t].orients[o];

export function sizeOf(t: PieceType, o: number): { w: number; h: number } {
  let w = 0;
  let h = 0;
  for (const [dx, dy] of cellsOf(t, o)) {
    w = Math.max(w, dx + 1);
    h = Math.max(h, dy + 1);
  }
  return { w, h };
}
