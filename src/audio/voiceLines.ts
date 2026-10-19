import { PLACES } from '../content/places';
import { ABOUT_SHISA, VARIANTS } from '../content/shisa';
import { SHISA_CALL, SHISA_CHEER, SHISA_HELLO, SHISA_REST, STORY } from '../content/story';
import { RULES } from '../content/text';
import type { Voice } from './voice';

/** Every line the game reads aloud, for the recording script and for the test that each one has its recording */
export function voiceLines(): { text: string; as: Voice }[] {
  const narrator = [
    ...STORY.flatMap((p) => (p.after ? [p.say, p.after] : [p.say])),
    ...Object.values(RULES),
    ABOUT_SHISA.story,
    ...VARIANTS.map((v) => v.story),
    ...Object.values(PLACES).map((p) => p.story),
  ];
  return [
    ...narrator.map((text) => ({ text, as: 'narrator' as const })),
    ...[SHISA_HELLO, SHISA_CHEER, SHISA_CALL, SHISA_REST].map((text) => ({ text, as: 'shisa' as const })),
  ];
}
