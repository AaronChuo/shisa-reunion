import { upgradeText } from '../content/decor';
import { allHints, type HintMood } from '../content/hints';
import { PLACES } from '../content/places';
import { ABOUT_SHISA, ROLE_ASK, SERIES, VARIANTS } from '../content/shisa';
import { SHISA_CALL, SHISA_HELLO, SHISA_REST, STORY } from '../content/story';
import { RULES } from '../content/text';
import type { Voice } from './voice';

/** A line the game reads aloud; `style` tells a designed voice how to say it (only the recording script uses it) */
export interface VoiceLine {
  text: string;
  as: Voice;
  style?: string;
}

/** How the shisa says a speech-bubble line, by what it is for */
const MOOD: Record<HintMood, string> = {
  guide: 'helpful and clear, showing a young child what to do',
  oops: 'gently and kindly letting a young child know it does not work',
  wow: 'surprised and excited',
  stop: 'cheerful and clear, announcing the next stop',
  last: 'excited, announcing the last stop of the trip',
};

/** Every line the game reads aloud, for the recording script and for the test that each one has its recording */
export function voiceLines(): VoiceLine[] {
  const narrator = [
    ...STORY.flatMap((p) => (p.after ? [p.say, p.after] : [p.say])),
    ...Object.values(RULES),
    ABOUT_SHISA.story,
    ROLE_ASK,
    ...VARIANTS.map((v) => v.story),
    ...Object.values(PLACES).flatMap((p) => p.cards.map((c) => c.story)),
    ...SERIES.flatMap((se) => [false, true].map((two) => upgradeText(se, two))),
  ];
  const shisa: [string, string][] = [
    [SHISA_HELLO, 'a proud, friendly self-introduction'],
    [SHISA_CALL, 'calling out happily to a friend'],
    [SHISA_REST, 'caring and gentle, kindly telling a child to take a break'],
  ];
  return [
    ...narrator.map((text) => ({ text, as: 'narrator' as const })),
    ...shisa.map(([text, style]) => ({ text, as: 'shisa' as const, style })),
    ...allHints().map(({ text, mood }) => ({ text, as: 'shisa' as const, style: MOOD[mood] })),
  ];
}
