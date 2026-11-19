import type { PieceType } from '../engine';
import { STARTERS, VARIANT_BY_ID } from './shisa';
import { PIECE_NAMES } from './text';
import { ZONES } from './zones';

// What the shisa says in the speech bubble on the play screen, read aloud in its own voice (ADR-0041). Every line the
// game can say is listed by allHints(), so each one is recorded; a line that is not (the first stop's line for a pair
// other than the starters) only shows.

/** The star sand to scoop up first, said after the stop's blocks */
const starLine = (stars: number): string => (stars ? `，要先撿${stars > 1 ? ` ${stars} 堆` : ''}星砂` : '');

/** The very first stop, while a finger shows where the first block goes */
export const coachLine = (hero: string, goal: string, stars: number): string => `把積木拖進來，幫${hero}${stars ? '先撿星砂，再' : ''}走到${goal}身邊`;
/** Arriving at a stop */
export const stopLine = (blocks: number, stars: number): string => `這一站要用 ${blocks} 塊積木${starLine(stars)}`;
/** Arriving at the last stop of a zone */
export const lastStopLine = (name: string, stars: number): string => `最後一站：${name}${starLine(stars)}`;
/** A hint: where the block that glows goes */
export const putLine = (t: PieceType): string => `把發亮的${PIECE_NAMES[t]}放到虛線那裡`;

export const PICKED = '點一下盤面放下，或直接拖過去';
export const GATE_OPENS = '石門打開了！';
export const TIDE_RISES = '海水漲上來了！';
export const TIDE_TOO_HIGH = '海水漲太高了，按「重來」讓海水退回去';
export const LIFT_FIRST = '先把發亮的這塊拿下來';
export const PINNED = '上面還壓著別的東西';
export const NO_ROOM = '這裡放不下了';
export const WOULD_FALL = '這樣會倒下來喔';
export const FIXED = '這塊是固定的，搬不動';

/** How a line is meant: showing the way, something going wrong, something happening, a stop starting, the last stop */
export type HintMood = 'guide' | 'oops' | 'wow' | 'stop' | 'last';

/** Every line the bubble can say on the play screen, for the recordings */
export function allHints(): { text: string; mood: HintMood }[] {
  // Blocks a stop can ask for: at most its zone's largest stop, and never fewer than one
  const most = Math.max(...ZONES.flatMap((z) => [...z.ks, z.boss.k]));
  const stars = [0, 1];
  const [hero, goal] = STARTERS.map((id) => VARIANT_BY_ID[id].name);
  return [
    ...stars.map((s) => ({ text: coachLine(hero, goal, s), mood: 'guide' as const })),
    ...Array.from({ length: most }, (_, i) => stars.map((s) => ({ text: stopLine(i + 1, s), mood: 'stop' as const }))).flat(),
    ...ZONES.flatMap((z) => [0, z.boss.stars ?? 1].map((s) => ({ text: lastStopLine(z.boss.name, s), mood: 'last' as const }))),
    ...(Object.keys(PIECE_NAMES) as PieceType[]).map((t) => ({ text: putLine(t), mood: 'guide' as const })),
    ...[PICKED, TIDE_TOO_HIGH, LIFT_FIRST].map((text) => ({ text, mood: 'guide' as const })),
    ...[GATE_OPENS, TIDE_RISES].map((text) => ({ text, mood: 'wow' as const })),
    ...[PINNED, NO_ROOM, WOULD_FALL, FIXED].map((text) => ({ text, mood: 'oops' as const })),
  ];
}
