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
      // Lying down
      [
        [0, 0, 'solid'],
        [1, 0, 'solid'],
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
  // Shape blocks: plain cells in a shape, each orientation a quarter turn clockwise from the one before
  bar: {
    orients: [
      [
        [0, 0, 'solid'],
        [1, 0, 'solid'],
        [2, 0, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [0, 1, 'solid'],
        [0, 2, 'solid'],
      ],
    ],
  },
  // An L, its corner at the bottom left, then top left, top right, bottom right
  corner: {
    orients: [
      [
        [0, 0, 'solid'],
        [1, 0, 'solid'],
        [0, 1, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [0, 1, 'solid'],
        [1, 1, 'solid'],
      ],
      [
        [1, 0, 'solid'],
        [0, 1, 'solid'],
        [1, 1, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [1, 0, 'solid'],
        [1, 1, 'solid'],
      ],
    ],
  },
  // A T, open with its pole down, then the pole to the left, up, to the right
  parasol: {
    orients: [
      [
        [1, 0, 'solid'],
        [0, 1, 'solid'],
        [1, 1, 'solid'],
        [2, 1, 'solid'],
      ],
      [
        [1, 0, 'solid'],
        [1, 1, 'solid'],
        [1, 2, 'solid'],
        [0, 1, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [1, 0, 'solid'],
        [2, 0, 'solid'],
        [1, 1, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [0, 1, 'solid'],
        [0, 2, 'solid'],
        [1, 1, 'solid'],
      ],
    ],
  },
  // S lying and standing, then turned over: Z lying and standing
  wave: {
    orients: [
      [
        [0, 0, 'solid'],
        [1, 0, 'solid'],
        [1, 1, 'solid'],
        [2, 1, 'solid'],
      ],
      [
        [1, 0, 'solid'],
        [1, 1, 'solid'],
        [0, 1, 'solid'],
        [0, 2, 'solid'],
      ],
      [
        [1, 0, 'solid'],
        [2, 0, 'solid'],
        [0, 1, 'solid'],
        [1, 1, 'solid'],
      ],
      [
        [0, 0, 'solid'],
        [0, 1, 'solid'],
        [1, 1, 'solid'],
        [1, 2, 'solid'],
      ],
    ],
  },
};

export const cellsOf = (t: PieceType, o: number): PieceCell[] => DEFS[t].orients[o];

/** What the physics needs to know about one orientation of a piece, worked out once */
export interface Shape {
  cells: PieceCell[];
  w: number;
  h: number;
  /** Cells with no cell of the same piece right below them: the ones that rest on something */
  bottoms: PieceCell[];
  mass: number;
  /** Mass-weighted sum of the cells' centre offsets, so the centre of mass is x + massX / mass */
  massX: number;
}

const SHAPES = Object.fromEntries(
  (Object.keys(DEFS) as PieceType[]).map((t) => [
    t,
    DEFS[t].orients.map((cells): Shape => {
      let w = 0;
      let h = 0;
      let mass = 0;
      let massX = 0;
      for (const [dx, dy, k] of cells) {
        w = Math.max(w, dx + 1);
        h = Math.max(h, dy + 1);
        mass += MASS[k];
        massX += MASS[k] * (dx + 0.5);
      }
      const bottoms = cells.filter(([dx, dy]) => !cells.some(([ex, ey]) => ex === dx && ey === dy - 1));
      return { cells, w, h, bottoms, mass, massX };
    }),
  ]),
) as Record<PieceType, Shape[]>;

export const shapeOf = (t: PieceType, o: number): Shape => SHAPES[t][o];

export function sizeOf(t: PieceType, o: number): { w: number; h: number } {
  const { w, h } = SHAPES[t][o];
  return { w, h };
}
