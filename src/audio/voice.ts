// Recorded lines (`pnpm voice`, scripts/voice.mjs): the narration in Azure's Taiwan Mandarin neural voice (ADR-0021),
// the shisa in a voice of its own designed with Gemini (ADR-0040). Kept in public/voice/ and precached so they play
// offline. Shared by the game and the recording script, so both name a recording the same way. A line without a
// recording falls back to the device's own voice (speech.ts).

/** How a line is said: the calm storyteller, or a shisa itself, brighter and livelier */
export type Voice = 'narrator' | 'shisa';

/** An Azure neural voice and its tone, as SSML prosody */
export interface AzureVoice {
  engine: 'azure';
  name: string;
  pitch: string;
  rate: string;
}

/**
 * A voice made with Gemini's voice design and kept in the Google project the key belongs to; every line is slowed to
 * `tempo` of its speed afterwards, which keeps the pace even where asking Gemini to slow down did not
 */
export interface GeminiVoice {
  engine: 'gemini';
  model: string;
  voice: string;
  tempo: number;
}

/** The voice for each kind of line; changing one re-records every line of that kind */
export const RECORDING: Record<Voice, AzureVoice | GeminiVoice> = {
  narrator: { engine: 'azure', name: 'zh-TW-HsiaoChenNeural', pitch: '+0%', rate: '1' },
  // Designed (zh-TW, female) from: "An energetic Taiwanese voice actress in her twenties who voices bouncy cartoon
  // sidekicks: bright, high and lively, a little mischievous, always sounding like she is smiling. Taiwanese Mandarin
  // with a natural Taiwan accent." A stored voice lapses after a year unused; designing it again gives a new voice
  shisa: { engine: 'gemini', model: 'gemini-3.8-flash-tts', voice: 'voice_epzr5u2568fl', tempo: 0.92 },
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
  const how = r.engine === 'azure' ? `${r.name}|${r.pitch}|${r.rate}` : `${r.model}|${r.voice}|${r.tempo}`;
  const s = `${how}|${speakable(text)}`;
  return fnv(s, 0x811c9dc5) + fnv(s, 0x01000193);
}
