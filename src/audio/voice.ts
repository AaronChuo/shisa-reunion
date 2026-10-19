// Recorded narration: lines read by Azure's Taiwan Mandarin neural voice (`pnpm voice`, scripts/voice.mjs), kept in
// public/voice/ and precached so they play offline. Shared by the game and the recording script, so both name a
// recording the same way. A line without a recording falls back to the device's own voice (speech.ts).

/** How a line is said: the calm storyteller, or a shisa itself, higher and livelier */
export type Voice = 'narrator' | 'shisa';

/** The Azure voice and its tone for each kind of line; changing one re-records every line of that kind */
export const RECORDING: Record<Voice, { name: string; pitch: string; rate: string }> = {
  narrator: { name: 'zh-TW-HsiaoChenNeural', pitch: '+0%', rate: '1' },
  shisa: { name: 'zh-TW-HsiaoChenNeural', pitch: '+30%', rate: '1.1' },
};

/**
 * What the voice should say: a reading with the Japanese word after it in brackets, 「西薩（シーサー）」, is said as
 * the reading alone, and any other kana is dropped, since a Mandarin voice can't pronounce it.
 */
export function speakable(text: string): string {
  return text.replace(/（[\u3040-\u30FF]+）/g, '').replace(/[\u3040-\u30FF]+/g, '');
}

/** FNV-1a over the UTF-16 code units, from a given offset basis */
function fnv(s: string, basis: number): string {
  let h = basis;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** A recording's file name: a hash of what is said and how, so a changed line or tone gets a new recording */
export function voiceKey(text: string, as: Voice): string {
  const r = RECORDING[as];
  const s = `${r.name}|${r.pitch}|${r.rate}|${speakable(text)}`;
  return fnv(s, 0x811c9dc5) + fnv(s, 0x01000193);
}
