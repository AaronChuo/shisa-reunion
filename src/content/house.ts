import { zonesBeen } from './places';
import { ZONES } from './zones';

// 西薩的家 (ADR-0037): the red-tile house the pair lives on, which the player decorates like a sticker book. The pair
// stands on the ridge; the yard takes the decorations and every shisa pulled from the gacha machines, one of each, put
// wherever they are dropped. The picture behind the house is the sky, or any zone with a stop cleared.

/** The house picture's own units; a sticker's place is where its feet are */
export const HOUSE_W = 360;
export const HOUSE_H = 450;

/** At most this many things in the house, so the picture never gets crowded and older phones keep up */
export const HOUSE_CAP = 30;

export interface Decor {
  id: string;
  name: string;
  /** Width in house units; each is drawn in a 100 × 100 box with its feet at the bottom */
  w: number;
}

/** Every house starts with these */
export const DECOR: Decor[] = [
  { id: 'hibiscus', name: '扶桑花盆', w: 46 },
  { id: 'stone', name: '石敢當', w: 38 },
  { id: 'jar', name: '水缸', w: 50 },
];

export const DECOR_BY_ID: Record<string, Decor> = Object.fromEntries(DECOR.map((d) => [d.id, d]));

/** A shisa in the yard, framed like ShisaIcon (92 × 104) */
export const SHISA_W = 56;
export const SHISA_H = Math.round((SHISA_W * 104) / 92);

export const isDecor = (id: string): boolean => id in DECOR_BY_ID;

export function stickerSize(id: string): { w: number; h: number } {
  const d = DECOR_BY_ID[id];
  return d ? { w: d.w, h: d.w } : { w: SHISA_W, h: SHISA_H };
}

/** Where the pair stands on the ridge, by their feet */
export const ROOF_SPOTS = [
  { x: 146, y: 228 },
  { x: 214, y: 228 },
] as const;

/** One thing in the house: a decoration or a shisa, by id (the two never share an id), and where its feet are */
export interface Sticker {
  id: string;
  x: number;
  y: number;
}

export interface House {
  /** The picture behind the house: SKY, or a zone id */
  bd: string;
  /** In the order they were put in; drawn front to back by how low they stand */
  placed: Sticker[];
}

export const SKY = 'sky';

export const freshHouse = (): House => ({ bd: SKY, placed: [] });

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Keeps a sticker whole inside the picture, clear of its bottom edge, its feet on whole units */
export function clampSpot(id: string, x: number, y: number): { x: number; y: number } {
  const { w, h } = stickerSize(id);
  return { x: Math.round(clamp(x, w / 2, HOUSE_W - w / 2)), y: Math.round(clamp(y, h, HOUSE_H - 6)) };
}

/** The front door, which a tapped sticker lands near when the yard is empty */
const DOOR = { x: 180, y: 400 };
/** Far enough apart that two things in the yard don't hide each other */
const GAP = 80;
/** Spots in the yard in front of the house */
const YARD = [388, 412, 436].flatMap((y) => Array.from({ length: 13 }, (_, i) => ({ x: 30 + i * 25, y })));

/** Where a tapped sticker hops to: the yard spot farthest from everything there (up to GAP), nearest the door among equals */
export function freeSpot(placed: readonly Sticker[]): { x: number; y: number } {
  let best = YARD[0];
  let score = Number.NEGATIVE_INFINITY;
  for (const s of YARD) {
    const gap = Math.min(GAP, ...placed.map((p) => Math.hypot(p.x - s.x, p.y - s.y)));
    const v = gap - Math.hypot(s.x - DOOR.x, s.y - DOOR.y) / 100;
    if (v > score) {
      score = v;
      best = s;
    }
  }
  return best;
}

/** The pictures the house can stand in front of: the sky, then every zone, open once a stop there is cleared */
export function backdrops(seen: string[], clears: Record<string, number>): { id: string; name: string; open: boolean }[] {
  const been = new Set(zonesBeen(seen, clears).map((Z) => Z.id));
  return [{ id: SKY, name: '藍天', open: true }, ...ZONES.map((Z) => ({ id: Z.id, name: Z.name, open: been.has(Z.id) }))];
}

/**
 * Repairs a saved house: a picture that isn't open goes back to the sky; things not owned, on the roof, repeated, or
 * past the cap are dropped; places are kept inside the picture
 */
export function normalizeHouse(raw: unknown, p: { owned: string[]; pair: readonly string[]; seen: string[]; clears: Record<string, number> }): House {
  const h = (raw && typeof raw === 'object' ? raw : {}) as { bd?: unknown; placed?: unknown };
  const bd = backdrops(p.seen, p.clears).some((b) => b.open && b.id === h.bd) ? (h.bd as string) : SKY;
  const placed: Sticker[] = [];
  for (const s of Array.isArray(h.placed) ? h.placed : []) {
    if (placed.length >= HOUSE_CAP) break;
    if (!s || typeof s !== 'object') continue;
    const { id, x, y } = s as Partial<Sticker>;
    if (typeof id !== 'string' || typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    const ok = isDecor(id) || (p.owned.includes(id) && !p.pair.includes(id));
    if (ok && !placed.some((q) => q.id === id)) placed.push({ id, ...clampSpot(id, x, y) });
  }
  return { bd, placed };
}
