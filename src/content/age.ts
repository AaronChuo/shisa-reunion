// Who is playing, chosen by a grown-up the first time the game opens and changeable in the grown-ups' settings. It sets
// how much the game helps along: the hint shells and rerolls a stop or a journey comes with, the finger that points at
// the main button, the hint shell that wiggles when a child seems stuck, how loudly 走走看 offers itself, and the
// default for the rest reminder.

export type Age = 'little' | 'kid' | 'big';

export interface AgeSetting {
  label: string;
  /** One line for the grown-up choosing */
  detail: string;
  /** Hint shells and rerolls come anew on every stop, or once for the whole journey */
  per: 'stop' | 'run';
  /** Hint shells: this many for each block on the stop, or null for as many as the zone's difficulty stars */
  hintsPerBlock: number | null;
  /** Rerolls; null for as many as wanted */
  rerolls: number | null;
  /** Idle time before a finger points at the main button; null for none */
  nudgeMs: number | null;
  /** Idle time on a stop before the hint shell wiggles; null for none */
  stuckMs: number | null;
  /** 走走看 sits up front, coloured, rather than as a plain button */
  tryFirst: boolean;
  /** Minutes of play before a rest reminder, as the default for this age; null for none */
  restMin: number | null;
}

export const AGES: Record<Age, AgeSetting> = {
  little: {
    label: '未滿 6 歲',
    detail: '每站的提示是積木數的兩倍，換題不限次數；手指常常出來示範，玩 20 分鐘提醒休息',
    per: 'stop',
    hintsPerBlock: 2,
    rerolls: null,
    nudgeMs: 4500,
    stuckMs: 25_000,
    tryFirst: true,
    restMin: 20,
  },
  kid: {
    label: '6–11 歲',
    detail: '每站的提示和積木一樣多，每站換題 2 次；手指晚一點才出來，玩 30 分鐘提醒休息',
    per: 'stop',
    hintsPerBlock: 1,
    rerolls: 2,
    nudgeMs: 8000,
    stuckMs: 45_000,
    tryFirst: false,
    restMin: 30,
  },
  big: {
    label: '12 歲以上',
    detail: '一趟旅程的提示和地區的星星一樣多，一趟換題 2 次；不出手指提示，不提醒休息',
    per: 'run',
    hintsPerBlock: null,
    rerolls: 2,
    nudgeMs: null,
    stuckMs: null,
    tryFirst: false,
    restMin: null,
  },
};

export const AGE_ORDER: Age[] = ['little', 'kid', 'big'];

/** Until someone has chosen, the game helps as much as it does for the youngest */
export const ageOf = (age: Age | null): AgeSetting => AGES[age ?? 'little'];

/**
 * Hint shells and rerolls on arriving at stop `si` with `blocks` blocks, in a zone with `stars` difficulty stars. Null
 * when the journey keeps what it has: older players get theirs once, on the first stop.
 */
export function handOut(a: AgeSetting, si: number, blocks: number, stars: number): { shell: number; conch: number | null } | null {
  if (a.per === 'run' && si > 0) return null;
  return { shell: a.hintsPerBlock === null ? stars : a.hintsPerBlock * blocks, conch: a.rerolls };
}

/** Rest reminder lengths a grown-up can pick, in minutes; null is no reminder */
export const REST_CHOICES: (number | null)[] = [15, 20, 30, 45, 60, null];
