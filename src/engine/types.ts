export type PieceType = 'cube' | 'tower' | 'stair' | 'bridge' | 'ladder' | 'spring' | 'long' | 'slide' | 'vine';

// solid: flat top, blocks walking through
// stairR / stairL: climbs left→right / right→left; slanted top, nothing can rest on it
// arch: flat top, can walk through underneath
// ladder: flat top, can stand inside and climb within the column
// spring: characters bounce 1–2 levels sideways from its top; too soft to stack on
// slideR / slideL: smooth slope going down to the right / left; one way only, downhill
// vine: hangs from the underside of a block; characters climb it, nothing rests on it
export type CellKind = 'solid' | 'stairR' | 'stairL' | 'arch' | 'ladder' | 'spring' | 'slideR' | 'slideL' | 'vine';

/** [dx, dy, kind] relative to the piece's bottom-left cell */
export type PieceCell = readonly [number, number, CellKind];

export interface Placement {
  t: PieceType;
  o: number;
  x: number;
  y: number;
}

/** A player-placed piece; k is the index into the level's inventory */
export interface Placed extends Placement {
  k: number;
}

export interface Pos {
  x: number;
  y: number;
}

/** Stone gate at column x, h cells tall from the floor; opens while a piece rests on the plate at (px, py) */
export interface Gate {
  x: number;
  h: number;
  px: number;
  py: number;
}

/** Water rises one level every `every` placements, up to `max` */
export interface Tide {
  every: number;
  max: number;
}

export interface Level {
  w: number;
  fixed: Placement[];
  hero: Pos;
  goal: Pos;
  inv: PieceType[];
  urchin: number[];
  /** Star sand the hero must walk over (in any order) before reaching the goal */
  stars: Pos[];
  tide: Tide | null;
  gate: Gate | null;
  solutions?: number;
}

export type CellContentKind = CellKind | 'char' | 'gate' | 'gateOpen' | 'wall';

export interface Cell {
  k: CellContentKind;
  /** index into fixed ++ placed */
  i?: number;
  /** 0 = hero, 1 = goal, 2+ = star sand */
  c?: number;
}

export interface Grid {
  w: number;
  cells: (Cell | null)[];
  gateOpen: boolean;
  water: number;
  urchin: number[];
}

/** A walkable surface. Flat: l = r = y. Ramp: l/r are the heights at the column's left/right edge. */
export interface Surface {
  x: number;
  y: number;
  l: number;
  r: number;
  ramp: boolean;
  spring: boolean;
  /** Inside a ladder or vine cell: can climb to the spot above */
  ladder: boolean;
  /** Inside a vine: also reachable from the spot directly below, even with nothing underfoot */
  hang: boolean;
  /** One-way slope: 'R' goes down to the right, 'L' down to the left */
  slide: 'R' | 'L' | null;
}

export type Move = 'walk' | 'jump' | 'climb' | 'hang' | 'slide';

export interface PathStep {
  s: Surface;
  via: Move | null;
}

export interface GenConfig {
  w: number;
  k: number;
  pool: Partial<Record<PieceType, number>>;
  must: PieceType[];
  /** Moves every solution's path has to make */
  need: Move[];
  maxSols: number;
  urchin: number;
  tide: Tide | null;
  gate: boolean;
  /** How many star sand spots to place */
  stars: number;
  obs: [number, number];
}
