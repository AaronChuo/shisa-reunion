import type { GenConfig, Move, PieceType } from '../engine';

export type CardKey = 'calm' | 'easy' | 'hard' | 'urchin' | 'tide' | 'gate' | 'ladder' | 'spring' | 'long';

export interface Reward {
  shell?: number;
  conch?: number;
}

interface Mods {
  k?: number;
  must?: PieceType[];
  need?: Move;
  urchin?: number;
  tide?: boolean;
  gate?: boolean;
}

export interface Card extends Mods {
  name: string;
  line: string;
  reward?: Reward;
}

export interface Zone {
  id: string;
  name: string;
  tag: string;
  stars: number;
  color: string;
  w: number;
  line: string;
  pool: Partial<Record<PieceType, number>>;
  /** Mods for the zone's first stage, which introduces its new piece or mechanism */
  first?: Mods;
  /** Base piece count for stages 1–4 */
  ks: [number, number, number, number];
  cards: CardKey[];
  boss: { name: string; k: number; must?: PieceType[]; need?: Move; urchin?: number; tide?: boolean; gate?: boolean; maxSols: number };
}

/** Stages per run; the last one is the zone's final stop */
export const STAGES = 5;

const ALL: Partial<Record<PieceType, number>> = { stair: 3, cube: 2, tower: 1, bridge: 1, ladder: 1, spring: 1, long: 1 };

export const ZONES: Zone[] = [
  {
    id: 'naha',
    name: '那霸港',
    tag: '入門',
    stars: 1,
    color: '#3FA36B',
    w: 6,
    line: '港口邊的石階，先熱熱身',
    pool: { stair: 3, cube: 2, tower: 1 },
    ks: [1, 1, 2, 2],
    cards: ['calm', 'urchin', 'hard', 'easy'],
    boss: { name: '港口燈塔', k: 2, urchin: 1, maxSols: 2 },
  },
  {
    id: 'yomitan',
    name: '讀谷村',
    tag: '初級',
    stars: 2,
    color: '#D99A1E',
    w: 6,
    line: '竹林和紅芋田，學會爬竹梯',
    pool: { stair: 2, cube: 2, tower: 1, bridge: 1, ladder: 1 },
    first: { must: ['ladder'], need: 'climb' },
    ks: [2, 2, 2, 3],
    cards: ['calm', 'urchin', 'ladder', 'hard', 'easy'],
    boss: { name: '殘波岬', k: 3, must: ['ladder'], need: 'climb', urchin: 1, maxSols: 3 },
  },
  {
    id: 'motobu',
    name: '美麗海',
    tag: '進階',
    stars: 3,
    color: '#2D8FD0',
    w: 6,
    line: '海邊會漲潮，還有會彈人的跳跳貝',
    pool: { stair: 2, cube: 1, tower: 1, bridge: 1, ladder: 1, spring: 1, long: 1 },
    first: { must: ['spring'], need: 'jump' },
    ks: [2, 3, 3, 3],
    cards: ['calm', 'urchin', 'tide', 'spring', 'long', 'hard'],
    boss: { name: '大浪灘', k: 3, must: ['spring'], need: 'jump', tide: true, maxSols: 3 },
  },
  {
    id: 'shuri',
    name: '首里城',
    tag: '大師',
    stars: 4,
    color: '#8C56AA',
    w: 7,
    line: '城門有機關，要先壓住壓板',
    pool: ALL,
    first: { gate: true },
    ks: [3, 3, 3, 3],
    cards: ['urchin', 'tide', 'gate', 'ladder', 'spring', 'hard'],
    boss: { name: '守禮之門', k: 3, gate: true, urchin: 1, maxSols: 2 },
  },
];

/** Path choices offered between stages. Rewards are paid out when that stage is cleared. */
export const CARDS: Record<CardKey, Card> = {
  calm: { name: '平靜小路', line: '沒有機關，專心搭路' },
  easy: { name: '近路', line: '少一塊積木', k: -1 },
  hard: { name: '挑戰路', line: '多一塊積木，比較難', k: 1, reward: { shell: 2 } },
  urchin: { name: '海膽灘', line: '地上有海膽，不能踩', urchin: 1, reward: { shell: 1 } },
  tide: { name: '漲潮海岸', line: '每放 2 塊，海水就漲高', tide: true, reward: { shell: 1 } },
  gate: { name: '石門關', line: '積木壓住壓板，石門才會開', gate: true, reward: { conch: 1 } },
  ladder: { name: '竹林小徑', line: '一定要爬竹梯', must: ['ladder'], need: 'climb' },
  spring: { name: '貝殼灣', line: '一定要用跳跳貝', must: ['spring'], need: 'jump' },
  long: { name: '石橋河', line: '一定要用石拱橋', must: ['long'] },
};

const TIDE = { every: 2, max: 1 };

/** Generator settings for stage `si` of zone `zi`; `card` is the path chosen for stages 2–4 */
export function stageCfg(zi: number, si: number, card: CardKey | null): GenConfig {
  const Z = ZONES[zi];
  if (si === STAGES - 1) {
    const B = Z.boss;
    return {
      w: Z.w,
      k: B.k,
      pool: Z.pool,
      must: B.must ?? [],
      need: B.need ?? null,
      maxSols: B.maxSols,
      urchin: B.urchin ?? 0,
      tide: B.tide ? TIDE : null,
      gate: !!B.gate,
      obs: [0, 2],
    };
  }
  const cfg: GenConfig = { w: Z.w, k: Z.ks[si], pool: Z.pool, must: [], need: null, maxSols: 8, urchin: 0, tide: null, gate: false, obs: [0, 2] };
  const mods: Mods = si === 0 ? (Z.first ?? {}) : card ? CARDS[card] : {};
  if (mods.k) cfg.k = Math.max(1, Math.min(4, cfg.k + mods.k));
  if (mods.must) cfg.must = mods.must.slice();
  if (mods.need) cfg.need = mods.need;
  if (mods.urchin) cfg.urchin = mods.urchin + (zi >= 2 ? 1 : 0);
  if (mods.tide) cfg.tide = TIDE;
  if (mods.gate) cfg.gate = true;
  if (cfg.must.length > cfg.k) cfg.k = cfg.must.length;
  return cfg;
}

/** Easier fallbacks when a demanding stage can't be generated in time */
export function relax(cfg: GenConfig, step: number): GenConfig {
  const c: GenConfig = { ...cfg, must: cfg.must.slice() };
  if (step >= 1) c.maxSols = 12;
  if (step >= 2) {
    c.need = null;
    c.urchin = Math.min(c.urchin, 1);
  }
  if (step >= 3) {
    c.gate = false;
    c.tide = null;
  }
  if (step >= 4) {
    c.k = Math.max(1, c.k - 1);
    c.must = c.must.slice(0, c.k);
  }
  return c;
}

/** Two distinct path cards for the coming stage, drawn from the zone's deck with the run's seed */
export function pickCards(zi: number, si: number, seed: number, rand: (seed: number) => () => number): CardKey[] {
  const Z = ZONES[zi];
  const k = Z.ks[si] ?? 2;
  const opts = Z.cards.filter((c) => !(c === 'easy' && k <= 1));
  const r = rand(seed + si * 31);
  const a = opts.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 2);
}
