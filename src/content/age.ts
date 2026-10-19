// Who is playing, chosen once by a grown-up and changeable in the grown-ups' settings. It sets how much the game
// helps along: the finger that points at the main button and the hint shell that wiggles when a child seems stuck.

export type Age = 'little' | 'kid' | 'big';

export interface AgeSetting {
  label: string;
  /** One line for the grown-up choosing */
  detail: string;
  /** Idle time before a finger points at the main button; null for none */
  nudgeMs: number | null;
  /** Idle time on a stop before the hint shell wiggles; null for none */
  stuckMs: number | null;
}

export const AGES: Record<Age, AgeSetting> = {
  little: { label: '3–5 歲', detail: '手指常常出來示範，卡住一下提示貝就會搖', nudgeMs: 4500, stuckMs: 25_000 },
  kid: { label: '6–8 歲', detail: '手指晚一點才出來，提示貝也晚一點搖', nudgeMs: 8000, stuckMs: 45_000 },
  big: { label: '9 歲以上、大人', detail: '不出手指提示，提示貝也不搖', nudgeMs: null, stuckMs: null },
};

export const AGE_ORDER: Age[] = ['little', 'kid', 'big'];

/** Until someone has chosen, the game helps as much as it did before there was a choice */
export const ageOf = (age: Age | null): AgeSetting => AGES[age ?? 'little'];
