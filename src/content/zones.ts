import type { Sight, TimeOfDay } from '../art/Sights';
import type { SongId } from '../audio/songs';
import { type GenConfig, type Move, type PieceType, rng } from '../engine';

/**
 * Something a zone teaches: a special block or a mechanism. Each zone brings in at most one new element and teaches it on
 * its first stop; later stops mix it with elements the player learned in earlier zones. Building the path is the core of
 * the game, so a stop may also have no element at all.
 */
export type Element = 'ladder' | 'spring' | 'vine' | 'slide' | 'long' | 'urchin' | 'tide' | 'gate' | 'star';

/** Special blocks come into a stage only with their element, and the path then has to use them */
const SPECIAL: Partial<Record<Element, { t: PieceType; need?: Move; spare?: number }>> = {
  ladder: { t: 'ladder', need: 'climb' },
  spring: { t: 'spring', need: 'jump' },
  vine: { t: 'vine', need: 'hang', spare: 1 },
  slide: { t: 'slide', need: 'slide', spare: 1 },
  long: { t: 'long' },
};

export const isSpecial = (e: Element): boolean => !!SPECIAL[e];

export interface Tier {
  name: string;
  /** Chance of 0, 1, 2… elements on each of stops 2–4 */
  counts: number[];
  /** How many elements learned before join the zone's own on its last stop: [min, max] */
  bossExtra: [number, number];
  /** Zones of this tier to finish before the next tier opens; all but one when left out */
  need?: number;
  /** Stops (0-based) that start with a choice of two roads */
  branches: number[];
}

export const TIERS: Tier[] = [
  { name: '入門', counts: [1], bossExtra: [0, 0], branches: [2] },
  { name: '初級', counts: [0.3, 0.7], bossExtra: [0, 0], branches: [2] },
  { name: '進階', counts: [0.15, 0.55, 0.3], bossExtra: [1, 1], branches: [2] },
  { name: '高手', counts: [0.1, 0.45, 0.45], bossExtra: [1, 2], branches: [1, 3] },
  { name: '大師', counts: [0, 0.3, 0.5, 0.2], bossExtra: [1, 1], branches: [1, 2, 3] },
];

/** A zone's own element is this many times as likely to be drawn as one learned before */
const NEW_WEIGHT = 3;

/** Elements that never share a stop, because levels with both take too long to generate */
const AVOID: [Element, Element][] = [
  ['gate', 'star'],
  ['gate', 'tide'],
  ['gate', 'long'],
  ['gate', 'slide'],
  ['gate', 'vine'],
  ['spring', 'vine'],
  ['tide', 'vine'],
  ['long', 'vine'],
  ['long', 'star'],
  ['slide', 'vine'],
];
/** At most two special blocks on one stop, and nothing else with two of them, for the same reason */
const MAX_SPECIAL = 2;

/**
 * A road to the next stop. Roads only change the scenery (time of day and a landmark); the stop itself is the same
 * whichever one the child picks. Every road is a real place in its zone.
 */
export interface Road {
  name: string;
  time: TimeOfDay;
  sight: Sight;
}

export interface Zone {
  id: string;
  name: string;
  tier: number;
  color: string;
  w: number;
  line: string;
  /** Plain blocks this zone hands out; special blocks are added stop by stop */
  base: Partial<Record<PieceType, number>>;
  /** The element taught on the first stop, or null for plain building */
  intro: Element | null;
  /** Piece count for stops 1–4 */
  ks: [number, number, number, number];
  /** Background music for this zone's journey */
  bgm: SongId;
  boss: { name: string; k: number; maxSols: number; stars?: number };
  /** Three roads, one for each time of day; a branch offers two of them */
  roads: Road[];
}

/** Stages per run; the last one is the zone's final stop */
export const STAGES = 5;

const PLAIN: Partial<Record<PieceType, number>> = { stair: 2, cube: 2, tower: 1, bridge: 1 };

export const ZONES: Zone[] = [
  {
    id: 'naha',
    name: '那霸市',
    tier: 0,
    color: '#3FA36B',
    w: 6,
    line: '熱鬧的國際通和海港，先學會搭路',
    base: { stair: 3, cube: 2, tower: 1 },
    intro: null,
    ks: [1, 1, 2, 2],
    bgm: 'tensagu',
    boss: { name: '國際通', k: 3, maxSols: 3 },
    roads: [
      { name: '波之上海灘', time: 'day', sight: 'palms' },
      { name: '國際通', time: 'dusk', sight: 'town' },
      { name: '泊港', time: 'night', sight: 'pier' },
    ],
  },
  {
    id: 'yomitan',
    name: '讀谷村',
    tier: 1,
    color: '#D99A1E',
    w: 6,
    line: '竹林和紅芋田，學會爬竹梯',
    base: PLAIN,
    intro: 'ladder',
    ks: [2, 2, 3, 3],
    bgm: 'tanchame',
    boss: { name: '殘波岬', k: 3, maxSols: 3 },
    roads: [
      { name: '紅芋田', time: 'day', sight: 'field' },
      { name: '陶器之里', time: 'dusk', sight: 'town' },
      { name: '座喜味城跡', time: 'night', sight: 'castle' },
    ],
  },
  {
    id: 'motobu',
    name: '美麗海',
    tier: 2,
    color: '#2D8FD0',
    w: 7,
    line: '海邊的岩石上有海膽，小心別踩到',
    base: { stair: 2, cube: 1, tower: 1, bridge: 1 },
    intro: 'urchin',
    ks: [2, 3, 3, 4],
    bgm: 'toshin',
    boss: { name: '珊瑚礁', k: 4, maxSols: 3 },
    roads: [
      { name: '翡翠海灘', time: 'day', sight: 'palms' },
      { name: '備瀨福木林道', time: 'dusk', sight: 'forest' },
      { name: '本部港', time: 'night', sight: 'pier' },
    ],
  },
  {
    id: 'kouri',
    name: '古宇利島',
    tier: 2,
    color: '#E0628A',
    w: 7,
    line: '過了跨海大橋，海灘上有會彈人的跳跳貝',
    base: PLAIN,
    intro: 'spring',
    ks: [2, 3, 3, 4],
    bgm: 'hana',
    boss: { name: '心形岩', k: 4, maxSols: 3 },
    roads: [
      { name: '古宇利大橋', time: 'day', sight: 'bridge' },
      { name: '古宇利海灘', time: 'dusk', sight: 'palms' },
      { name: '星空下的大橋', time: 'night', sight: 'bridge' },
    ],
  },
  {
    id: 'nakagusuku',
    name: '中城城跡',
    tier: 2,
    color: '#B07A3E',
    w: 7,
    line: '彎彎的石牆和石拱門，學會搭石拱橋',
    base: PLAIN,
    intro: 'long',
    ks: [2, 3, 3, 4],
    bgm: 'arch',
    boss: { name: '石拱門', k: 4, maxSols: 3 },
    roads: [
      { name: '二之郭的石牆', time: 'day', sight: 'castle' },
      { name: '中城灣', time: 'dusk', sight: 'pier' },
      { name: '中村家住宅', time: 'night', sight: 'town' },
    ],
  },
  {
    id: 'taketomi',
    name: '竹富島',
    tier: 3,
    color: '#17A2A6',
    w: 9,
    line: '白沙小路上，要先撿閃亮的星砂',
    base: PLAIN,
    intro: 'star',
    ks: [2, 3, 4, 4],
    bgm: 'asadoya',
    boss: { name: '星砂海灘', k: 4, maxSols: 3 },
    roads: [
      { name: '白沙小路', time: 'day', sight: 'town' },
      { name: '西棧橋', time: 'dusk', sight: 'pier' },
      { name: '竹富島的星空', time: 'night', sight: 'palms' },
    ],
  },
  {
    id: 'iriomote',
    name: '西表島',
    tier: 3,
    color: '#6B8F2A',
    w: 9,
    line: '紅樹林的大樹上，垂著長長的藤蔓',
    base: PLAIN,
    intro: 'vine',
    ks: [2, 3, 4, 4],
    bgm: 'densa',
    boss: { name: '紅樹林', k: 4, maxSols: 3 },
    roads: [
      { name: '仲間川', time: 'day', sight: 'forest' },
      { name: '瑪麗伍度瀑布', time: 'dusk', sight: 'waterfall' },
      { name: '叢林夜路', time: 'night', sight: 'forest' },
    ],
  },
  {
    id: 'miyako',
    name: '宮古島',
    tier: 3,
    color: '#1E88C8',
    w: 9,
    line: '翻過砂山到海灘，學會溜滑梯',
    base: PLAIN,
    intro: 'slide',
    ks: [2, 3, 4, 4],
    bgm: 'hounen',
    boss: { name: '砂山海灘', k: 4, maxSols: 3 },
    roads: [
      { name: '伊良部大橋', time: 'day', sight: 'bridge' },
      { name: '東平安名崎', time: 'dusk', sight: 'lighthouse' },
      { name: '前濱海灘', time: 'night', sight: 'palms' },
    ],
  },
  {
    id: 'shuri',
    name: '首里城',
    tier: 4,
    color: '#8C56AA',
    w: 10,
    line: '石門有機關，要先壓住壓板',
    base: { stair: 3, cube: 2, tower: 1, bridge: 1 },
    intro: 'gate',
    ks: [2, 4, 4, 4],
    bgm: 'akata',
    boss: { name: '守禮之門', k: 4, maxSols: 2 },
    roads: [
      { name: '首里金城町石疊道', time: 'day', sight: 'town' },
      { name: '龍潭', time: 'dusk', sight: 'castle' },
      { name: '首里城夜景', time: 'night', sight: 'castle' },
    ],
  },
  {
    id: 'kumejima',
    name: '久米島',
    tier: 4,
    color: '#3A9E8F',
    w: 10,
    line: '海水會漲會退，西薩要走高的地方',
    base: PLAIN,
    intro: 'tide',
    ks: [2, 4, 4, 4],
    bgm: 'kumeaka',
    boss: { name: '果之濱', k: 4, maxSols: 3 },
    roads: [
      { name: '疊石', time: 'day', sight: 'rocks' },
      { name: '比屋定斷崖', time: 'dusk', sight: 'cliff' },
      { name: '久米島的星空', time: 'night', sight: 'palms' },
    ],
  },
];

export const zoneTag = (Z: Zone): string => TIERS[Z.tier].name;
/** Difficulty stars shown on the map and postcards */
export const zoneStars = (Z: Zone): number => Z.tier + 1;

const TIDE = { every: 2, max: 1 };

/** Generator settings for one stop: the zone's plain blocks plus whatever its elements bring */
export function stageCfg(zi: number, si: number, els: readonly Element[]): GenConfig {
  const Z = ZONES[zi];
  const boss = si === STAGES - 1;
  const pool = { ...Z.base };
  const cfg: GenConfig = {
    w: Z.w,
    k: boss ? Z.boss.k : Z.ks[si],
    pool,
    must: [],
    need: [],
    maxSols: boss ? Z.boss.maxSols : 8,
    urchin: 0,
    tide: null,
    gate: false,
    stars: 0,
    // Wider ground gets more fixed blocks, so there is more terrain to build around
    obs: [Math.max(0, Z.w - 7), Z.w - 4],
  };
  for (const e of els) {
    const sp = SPECIAL[e];
    if (sp) {
      pool[sp.t] = (pool[sp.t] ?? 0) + 1 + (sp.spare ?? 0);
      cfg.must.push(sp.t);
      if (sp.need) cfg.need.push(sp.need);
    } else if (e === 'urchin') cfg.urchin = Z.tier >= 3 && si > 0 && !boss ? 2 : 1;
    else if (e === 'tide') cfg.tide = TIDE;
    else if (e === 'gate') cfg.gate = true;
    else if (e === 'star') cfg.stars = boss ? (Z.boss.stars ?? 1) : 1;
  }
  // What the generator cannot yet build quickly is kept smaller: the stone gate on at most 9 columns with 4 pieces,
  // and the tide with 4 pieces (the floor floods after two, which leaves few ways to use a fifth). A vine needs no
  // cap: 逆築 sets up its hanging spot first
  if (cfg.gate) {
    cfg.w = Math.min(cfg.w, 9);
    cfg.k = Math.min(cfg.k, 4);
  }
  if (cfg.tide) cfg.k = Math.min(cfg.k, 4);
  cfg.obs = [Math.max(0, cfg.w - 7), cfg.w - 4];
  // The stone gate already takes up a column and the plate another, so it gets fewer fixed blocks
  if (cfg.gate) cfg.obs = [0, cfg.w - 5];
  cfg.k = Math.max(cfg.k, cfg.must.length);
  return cfg;
}

/** Elements the player has learned that may join zone `zi`: those taught by finished zones of the same or a lower tier */
export function learnedFor(zi: number, clears: Readonly<Record<string, number>>): Element[] {
  const tier = ZONES[zi].tier;
  const out: Element[] = [];
  ZONES.forEach((Z, i) => {
    if (i !== zi && Z.intro && Z.tier <= tier && (clears[Z.id] ?? 0) > 0) out.push(Z.intro);
  });
  return out;
}

const ORDER: Element[] = ['ladder', 'spring', 'vine', 'slide', 'long', 'urchin', 'tide', 'star', 'gate'];
/** Whether these elements may share a stop */
export const allowed = (set: readonly Element[]): boolean =>
  !AVOID.some(([a, b]) => set.includes(a) && set.includes(b)) && set.filter(isSpecial).length <= (set.length > 2 ? 1 : MAX_SPECIAL);
const avoided = (set: readonly Element[]) => !allowed(set);

/**
 * Which elements each of the five stops gets, drawn once when a run starts. The first stop teaches the zone's own
 * element; stops 2–4 draw a tier-dependent number of elements, the new one weighted up and on at least two of them;
 * the last stop has the new element plus a tier-dependent number of learned ones.
 */
export function planRun(zi: number, learned: readonly Element[], seed: number): Element[][] {
  const Z = ZONES[zi];
  const T = TIERS[Z.tier];
  const own = Z.intro;
  const older = learned.filter((e) => e !== own);
  const r = rng(seed ^ 0x5a17);
  const max = T.counts.length - 1;
  const drawCount = () => {
    let x = r();
    for (let n = 0; n < T.counts.length; n++) {
      x -= T.counts[n];
      if (x < 0) return n;
    }
    return max;
  };
  /** n distinct elements, weighted, that may share a stop with `base` and with each other */
  const draw = (n: number, from: { e: Element; w: number }[], base: Element[] = []): Element[] => {
    for (let tries = 0; tries < 20; tries++) {
      const left = from.slice();
      const set: Element[] = [];
      while (set.length < n && left.length) {
        let x = r() * left.reduce((a, c) => a + c.w, 0);
        let i = 0;
        while (i < left.length - 1 && x >= left[i].w) {
          x -= left[i].w;
          i++;
        }
        set.push(left.splice(i, 1)[0].e);
      }
      if (!avoided([...base, ...set])) return set;
    }
    // Rare: no draw fitted, so take the first single element that does, or none
    const one = from.find((c) => allowed([...base, c.e]));
    return one && n ? [one.e] : [];
  };
  const weighted = [...(own ? [{ e: own, w: NEW_WEIGHT }] : []), ...older.map((e) => ({ e, w: 1 }))];
  const mid = [0, 1, 2].map(() => draw(Math.min(drawCount(), weighted.length), weighted));
  // A new element needs practice: it is on at least two of stops 2–4
  if (own && max > 0) {
    for (const set of mid) {
      if (mid.filter((s) => s.includes(own)).length >= 2) break;
      if (set.includes(own)) continue;
      if (set.length < max) set.push(own);
      else set[Math.floor(r() * set.length)] = own;
      if (avoided(set)) set.splice(0, set.length, own);
    }
  }
  const [lo, hi] = T.bossExtra;
  const extra = Math.min(lo + Math.floor(r() * (hi - lo + 1)), older.length);
  const boss = [
    ...(own ? [own] : []),
    ...draw(
      extra,
      older.map((e) => ({ e, w: 1 })),
      own ? [own] : [],
    ),
  ];
  const tidy = (set: Element[]) => [...new Set(set)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return [own ? [own] : [], ...mid, boss].map(tidy);
}

/** Whether stop `si` of zone `zi` starts with a choice of roads */
export const isBranch = (zi: number, si: number): boolean => TIERS[ZONES[zi].tier].branches.includes(si);

/** The two roads offered before stop `si`, drawn from the run's seed: indices into the zone's roads */
export function roadOffer(zi: number, si: number, seed: number): [number, number] {
  const n = ZONES[zi].roads.length;
  const r = rng(seed + si * 613);
  const a = Math.floor(r() * n);
  const b = (a + 1 + Math.floor(r() * (n - 1))) % n;
  return a < b ? [a, b] : [b, a];
}

/** Easier fallbacks when a demanding stage can't be generated in time */
export function relax(cfg: GenConfig, step: number): GenConfig {
  const c: GenConfig = { ...cfg, must: cfg.must.slice(), need: cfg.need.slice() };
  if (step >= 1) c.maxSols = 12;
  if (step >= 2) {
    c.need = [];
    c.urchin = Math.min(c.urchin, 1);
    c.stars = Math.min(c.stars, 1);
  }
  if (step >= 3) {
    c.gate = false;
    c.tide = null;
    c.stars = 0;
  }
  if (step >= 4) {
    c.k = Math.max(1, c.k - 1);
    c.must = c.must.slice(0, c.k);
  }
  return c;
}

const zonesOf = (t: number) => ZONES.filter((Z) => Z.tier === t);

/** Zones of tier `t` to finish before the next tier opens */
export const tierNeed = (t: number): number => TIERS[t].need ?? Math.max(1, zonesOf(t).length - 1);

/** The tier below `t` that has zones, or -1 */
function tierBelow(t: number): number {
  let p = t - 1;
  while (p >= 0 && !zonesOf(p).length) p--;
  return p;
}

const tierDone = (t: number, clears: Readonly<Record<string, number>>) => zonesOf(t).filter((Z) => (clears[Z.id] ?? 0) > 0).length >= tierNeed(t);

/** Zone ids open with these clears: the first tier always, each next tier once enough of the one below is finished */
export function openFor(clears: Readonly<Record<string, number>>): string[] {
  const open: string[] = [];
  for (let t = 0; t < TIERS.length; t++) {
    const p = tierBelow(t);
    const reached = p < 0 || (zonesOf(p).some((Z) => open.includes(Z.id)) && tierDone(p, clears));
    if (!reached) break;
    for (const Z of zonesOf(t)) open.push(Z.id);
  }
  return ZONES.map((Z) => Z.id).filter((id) => open.includes(id));
}

/** What still has to be finished before zone `zi` opens, in words a parent can read out */
export function lockHint(zi: number, clears: Readonly<Record<string, number>>): string {
  const p = tierBelow(ZONES[zi].tier);
  if (p < 0) return '';
  const zs = zonesOf(p);
  if (zs.length === 1) return `先走完${zs[0].name}才會打開`;
  const done = zs.filter((Z) => (clears[Z.id] ?? 0) > 0).length;
  const left = Math.max(1, tierNeed(p) - done);
  return `${done ? '再' : ''}走完 ${left} 個${TIERS[p].name}地區才會打開`;
}
