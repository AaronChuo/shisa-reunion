import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { type Series, STARTERS, VARIANT_BY_ID } from '../content/shisa';
import type { IntroKey } from '../content/text';
import { type CardKey, type Reward, ZONES } from '../content/zones';
import type { Level, PathStep, Placed, Placement } from '../engine';

export type Phase = 'play' | 'branch' | 'choose' | 'done';

export interface Run {
  zi: number;
  si: number;
  seed: number;
  card: CardKey | null;
  cards: (CardKey | 'boss')[] | null;
  level: Level | null;
  placed: Placed[];
  moves: number;
  hist: { placed: Placed[]; moves: number }[];
  orient: number[];
  shell: number;
  conch: number;
  earned: number;
  rerolls: number;
  phase: Phase;
}

/** Everything that survives a reload (saved to this device's localStorage) */
export interface Progress {
  tokens: number;
  owned: string[];
  pair: [string, string];
  unlocked: number;
  clears: number[];
  /** Sound effects on/off */
  sound: boolean;
  /** Background music on/off */
  music: boolean;
  seen: string[];
  run: Run | null;
}

export type Screen = 'home' | 'play' | 'gacha' | 'dex';

export type Modal =
  | { kind: 'loading' }
  | { kind: 'intro'; key: IntroKey }
  | { kind: 'win'; reward: Reward | null; last: boolean }
  | { kind: 'branch' }
  | { kind: 'done'; zi: number; earned: number; unlocked: number | null }
  | { kind: 'confirmRun'; zi: number }
  | { kind: 'reveal'; id: string; series: Series['id'] }
  | { kind: 'role'; id: string }
  | { kind: 'audio' };

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
  /** Where the hero stopped after walking (grid units, feet position) */
  heroAt: { x: number; y: number; flip: boolean } | null;
  cheer: boolean;
  shake: { target: string; n: number } | null;
  gseries: Series['id'];
  pull: 'idle' | 'coin' | 'crank' | 'drop';
  pulled: string | null;
}

export interface GameState {
  progress: Progress;
  ui: Ui;
}

export const freshProgress = (): Progress => ({
  tokens: 0,
  owned: STARTERS.slice(),
  pair: [STARTERS[0], STARTERS[1]],
  unlocked: 0,
  clears: ZONES.map(() => 0),
  sound: true,
  music: true,
  seen: [],
  run: null,
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
  heroAt: null,
  cheer: false,
  shake: null,
  gseries: 'trad',
  pull: 'idle',
  pulled: null,
});

/** Repairs anything missing or invalid in saved progress so old saves keep loading */
export function normalizeProgress(raw: unknown): Progress {
  const base = freshProgress();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<Progress>;
  const owned = Array.isArray(p.owned) ? p.owned.filter((id) => VARIANT_BY_ID[id]) : base.owned;
  for (const id of STARTERS) if (!owned.includes(id)) owned.push(id);
  const pair: [string, string] =
    Array.isArray(p.pair) && p.pair.length === 2 && p.pair.every((id) => owned.includes(id)) && p.pair[0] !== p.pair[1] ? [p.pair[0], p.pair[1]] : base.pair;
  return {
    tokens: typeof p.tokens === 'number' && p.tokens >= 0 ? p.tokens : 0,
    owned,
    pair,
    unlocked: typeof p.unlocked === 'number' ? Math.max(0, Math.min(ZONES.length - 1, p.unlocked)) : 0,
    clears: ZONES.map((_, i) => (Array.isArray(p.clears) && typeof p.clears[i] === 'number' ? p.clears[i] : 0)),
    sound: typeof p.sound === 'boolean' ? p.sound : true,
    music: typeof p.music === 'boolean' ? p.music : true,
    seen: Array.isArray(p.seen) ? p.seen.filter((s) => typeof s === 'string') : [],
    run: p.run && typeof p.run === 'object' && typeof p.run.zi === 'number' ? (p.run as Run) : null,
  };
}

export const useGame = create<GameState>()(
  persist(
    immer(() => ({ progress: freshProgress(), ui: freshUi() })),
    {
      name: 'shisa-reunion',
      version: 1,
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
