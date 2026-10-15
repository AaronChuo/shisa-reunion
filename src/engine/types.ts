export type PieceType = 'cube' | 'tower' | 'stair' | 'bridge' | 'ladder' | 'spring' | 'long';

// solid: flat top, blocks walking through
// stairR / stairL: climbs left→right / right→left; slanted top, nothing can rest on it
// arch: flat top, can walk through underneath
// ladder: flat top, can stand inside and climb within the column
// spring: characters bounce 1–2 levels sideways from its top; too soft to stack on
export type CellKind = 'solid' | 'stairR' | 'stairL' | 'arch' | 'ladder' | 'spring';

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
  tide: Tide | null;
  gate: Gate | null;
  solutions?: number;
}

export type CellContentKind = CellKind | 'char' | 'gate' | 'gateOpen' | 'wall';

export interface Cell {
  k: CellContentKind;
  /** index into fixed ++ placed */
  i?: number;
  /** 0 = hero, 1 = goal */
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
  ladder: boolean;
}

export type Move = 'walk' | 'jump' | 'climb';

export interface PathStep {
  s: Surface;
  via: Move | null;
}

export interface GenConfig {
  w: number;
  k: number;
  pool: Partial<Record<PieceType, number>>;
  must: PieceType[];
  need: Move | null;
  maxSols: number;
  urchin: number;
  tide: Tide | null;
  gate: boolean;
  obs: [number, number];
}
