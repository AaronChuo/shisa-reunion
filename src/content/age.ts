// Who is playing, chosen once by a grown-up and changeable in the grown-ups' settings. It sets how much the game
// helps along: the finger that points at the main button, the hint shell that wiggles when a child seems stuck, how
// loudly 走走看 offers itself, and the default for the rest reminder.

export type Age = 'little' | 'kid' | 'big';

export interface AgeSetting {
  label: string;
  /** One line for the grown-up choosing */
  detail: string;
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
  little: { label: '3–5 歲', detail: '手指常常出來示範，玩 20 分鐘提醒休息', nudgeMs: 4500, stuckMs: 25_000, tryFirst: true, restMin: 20 },
  kid: { label: '6–8 歲', detail: '手指晚一點才出來，玩 30 分鐘提醒休息', nudgeMs: 8000, stuckMs: 45_000, tryFirst: true, restMin: 30 },
  big: { label: '9 歲以上、大人', detail: '不出手指提示，不提醒休息', nudgeMs: null, stuckMs: null, tryFirst: false, restMin: null },
};

export const AGE_ORDER: Age[] = ['little', 'kid', 'big'];

/** Until someone has chosen, the game helps as much as it did before there was a choice */
export const ageOf = (age: Age | null): AgeSetting => AGES[age ?? 'little'];

/** Rest reminder lengths a grown-up can pick, in minutes; null is no reminder */
export const REST_CHOICES: (number | null)[] = [15, 20, 30, 45, 60, null];
