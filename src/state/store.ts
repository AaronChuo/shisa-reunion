import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AGE_ORDER, type Age, REST_CHOICES } from '../content/age';
import type { PlaceId } from '../content/places';
import { type Series, STARTERS, VARIANT_BY_ID } from '../content/shisa';
import type { IntroKey } from '../content/text';
import { type Element, openFor, planRun, ZONES } from '../content/zones';
import type { Level, PathStep, Placed, Placement } from '../engine';

export type Phase = 'play' | 'branch' | 'choose' | 'done';

export interface Run {
  /** Zone id; `zi` is re-derived from it on load so reordering zones never breaks a saved run */
  zone: string;
  zi: number;
  si: number;
  seed: number;
  /** Elements on each of the five stops, drawn when the run starts */
  plan: Element[][];
  level: Level | null;
  placed: Placed[];
  moves: number;
  hist: { placed: Placed[]; moves: number }[];
  orient: number[];
  /** Hint shells left */
  shell: number;
  /** Rerolls left; null for as many as wanted */
  conch: number | null;
  earned: number;
  rerolls: number;
  phase: Phase;
  /** Zone ids opened by finishing this run */
  opened?: string[];
}

/** Everything that survives a reload (saved to this device's localStorage) */
export interface Progress {
  tokens: number;
  owned: string[];
  pair: [string, string];
  /** Ids of zones that can be entered */
  open: string[];
  /** Finished runs per zone id */
  clears: Record<string, number>;
  /** Sound effects on/off */
  sound: boolean;
  /** Background music on/off */
  music: boolean;
  seen: string[];
  run: Run | null;
  /** Who is playing, chosen by a grown-up; null until asked */
  age: Age | null;
  /** Minutes of play before a rest reminder; null for none */
  restMin: number | null;
}

export type Screen = 'home' | 'play' | 'gacha' | 'dex';

/** The collection's pages */
export type DexTab = 'shisa' | 'cards';

export type Modal =
  | { kind: 'loading' }
  | { kind: 'intro'; key: IntroKey }
  /** `card`: the zone's postcard this stop earned (its first), if any */
  | { kind: 'win'; last: boolean; card: number | null }
  | { kind: 'branch' }
  /** `card`: the zone's postcard this journey earned (its second or third), if any */
  | { kind: 'done'; zi: number; earned: number; unlocked: number[]; card: number | null }
  | { kind: 'confirmRun'; zi: number }
  | { kind: 'reveal'; id: string; series: Series['id']; color: string }
  | { kind: 'role'; id: string }
  | { kind: 'about' }
  /** `n`: which of the place's cards is showing */
  | { kind: 'place'; id: PlaceId; start: number | null; n: number }
  | { kind: 'credits' }
  | { kind: 'audio' }
  | { kind: 'age' }
  | { kind: 'parents' }
  | { kind: 'rest' };

export type Hint = { type: 'lift'; pi: number } | { type: 'put'; p: Placement; k: number };

export interface Ui {
  screen: Screen;
  modal: Modal | null;
  /** Inventory index picked by tapping a tray card, -1 when none */
  sel: number;
  hint: Hint | null;
  /** True while generating, walking or celebrating: board input is ignored */
  busy: boolean;
  justPlaced: number;
  coach: boolean;
  bubble: { text: string; n: number } | null;
  walking: PathStep[] | null;
  /** Star sand the hero has scooped up on the winning walk */
  picked: number[];
  /** Where the hero stopped after walking (grid units, feet position) */
  heroAt: { x: number; y: number; flip: boolean } | null;
  cheer: boolean;
  shake: { target: string; n: number } | null;
  gseries: Series['id'];
  /**
   * The gacha machine: idle → a coin goes in (ready) → a full turn of the crank lets a capsule drop → it lands in
   * the tray (out) → tapping it opens it
   */
  pull: 'idle' | 'ready' | 'drop' | 'out';
  pulled: string | null;
  /** Colour of the capsule that dropped */
  capColor: string | null;
  /** Bumped to make the crank turn by itself once (the main button, or the keyboard) */
  spin: number;
  /** The opening story is showing */
  story: boolean;
  /** The hero is on a 走走看 walk, which ends wherever the road runs out */
  trying: boolean;
  /** The collection page last looked at, kept while the game is open */
  dexTab: DexTab;
}

export interface GameState {
  progress: Progress;
  ui: Ui;
}

export const freshProgress = (): Progress => ({
  tokens: 0,
  owned: STARTERS.slice(),
  pair: [STARTERS[0], STARTERS[1]],
  open: [ZONES[0].id],
  clears: Object.fromEntries(ZONES.map((Z) => [Z.id, 0])),
  sound: true,
  music: true,
  seen: [],
  run: null,
  age: null,
  restMin: null,
});

const freshUi = (): Ui => ({
  screen: 'home',
  modal: null,
  sel: -1,
  hint: null,
  busy: false,
  justPlaced: -1,
  coach: false,
  bubble: null,
  walking: null,
  picked: [],
  heroAt: null,
  cheer: false,
  shake: null,
  gseries: 'trad',
  pull: 'idle',
  pulled: null,
  capColor: null,
  spin: 0,
  story: false,
  trying: false,
  dexTab: 'shisa',
});

/** Zone order before v0.5: progress was saved as arrays in this order */
const LEGACY_ZONES = ['naha', 'yomitan', 'motobu', 'shuri'];

/**
 * Zones that took over a zone dropped in v0.27, with the id they replace: the same element and the same part of the
 * map (Ishigaki's star sand was Taketomi's, Yanbaru's vines were Iriomote's), so progress there carries over
 */
const FORMER: Record<string, string> = { ishigaki: 'taketomi', yanbaru: 'iriomote' };
const NOW: Record<string, string> = Object.fromEntries(Object.entries(FORMER).map(([now, was]) => [was, now]));

const zoneIndex = (id: unknown): number => ZONES.findIndex((Z) => Z.id === (typeof id === 'string' ? (NOW[id] ?? id) : id));

function normalizeRun(raw: unknown): Run | null {
  if (!raw || typeof raw !== 'object') return null;
  // Runs saved while the child picked between scenery roads still carry the picks; the stop now sets the time of day
  const { road: _road, ...r } = raw as Partial<Run> & { road?: unknown };
  const zi = zoneIndex(typeof r.zone === 'string' ? r.zone : typeof r.zi === 'number' ? LEGACY_ZONES[r.zi] : null);
  if (zi < 0 || typeof r.si !== 'number') return null;
  // Levels saved before star sand existed have no stars
  const level = r.level ? { ...r.level, stars: Array.isArray(r.level.stars) ? r.level.stars : [] } : null;
  // Runs saved before stops had planned elements get a plan drawn from their seed
  const plan = Array.isArray(r.plan) && r.plan.length === 5 ? r.plan : planRun(zi, [], typeof r.seed === 'number' ? r.seed : 0);
  const old = (r as { opened?: unknown }).opened;
  const opened = Array.isArray(old) ? old.filter((id): id is string => typeof id === 'string') : typeof old === 'string' ? [old] : [];
  return { ...(r as Run), zone: ZONES[zi].id, zi, level, plan, opened };
}

/** Repairs anything missing or invalid in saved progress so old saves keep loading */
export function normalizeProgress(raw: unknown): Progress {
  const base = freshProgress();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<Omit<Progress, 'clears'>> & { clears?: unknown; unlocked?: unknown };
  const owned = Array.isArray(p.owned) ? p.owned.filter((id) => VARIANT_BY_ID[id]) : base.owned;
  for (const id of STARTERS) if (!owned.includes(id)) owned.push(id);
  const pair: [string, string] =
    Array.isArray(p.pair) && p.pair.length === 2 && p.pair.every((id) => owned.includes(id)) && p.pair[0] !== p.pair[1] ? [p.pair[0], p.pair[1]] : base.pair;
  const legacy = Array.isArray(p.clears);
  const saved = legacy ? {} : ((p.clears ?? {}) as Record<string, unknown>);
  const clears: Record<string, number> = {};
  for (const Z of ZONES) {
    const v = legacy ? (p.clears as unknown[])[LEGACY_ZONES.indexOf(Z.id)] : (saved[Z.id] ?? saved[FORMER[Z.id]]);
    clears[Z.id] = typeof v === 'number' && v >= 0 ? v : 0;
  }
  const open = legacy
    ? LEGACY_ZONES.slice(0, (typeof p.unlocked === 'number' ? p.unlocked : 0) + 1)
    : Array.isArray(p.open)
      ? p.open.filter((id) => zoneIndex(id) >= 0).map((id) => ZONES[zoneIndex(id)].id)
      : [];
  // Zones never close again; the tier rules also open zones added after a save was made
  open.push(...openFor(clears));
  return {
    tokens: typeof p.tokens === 'number' && p.tokens >= 0 ? p.tokens : 0,
    owned,
    pair,
    open: ZONES.map((Z) => Z.id).filter((id) => open.includes(id)),
    clears,
    sound: typeof p.sound === 'boolean' ? p.sound : true,
    music: typeof p.music === 'boolean' ? p.music : true,
    seen: Array.isArray(p.seen) ? p.seen.filter((s) => typeof s === 'string') : [],
    run: normalizeRun(p.run),
    age: AGE_ORDER.includes(p.age as Age) ? (p.age as Age) : null,
    restMin: REST_CHOICES.includes(p.restMin as number) ? (p.restMin as number) : null,
  };
}

export const useGame = create<GameState>()(
  persist(
    immer(() => ({ progress: freshProgress(), ui: freshUi() })),
    {
      name: 'shisa-reunion',
      version: 2,
      // normalizeProgress reads every older save shape, so migrating just hands the data through
      migrate: (persisted) => persisted as GameState,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ progress: s.progress }),
      merge: (persisted, current) => ({ ...current, progress: normalizeProgress((persisted as { progress?: unknown } | undefined)?.progress) }),
    },
  ),
);

/** Immer-style update of the whole state */
export function mut(fn: (s: GameState) => void): void {
  useGame.setState(fn);
}
export const getState = (): GameState => useGame.getState();
export const currentRun = (): Run | null => useGame.getState().progress.run;
