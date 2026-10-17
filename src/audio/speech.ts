import { useEffect, useState } from 'react';
import { holdMusicDown } from './context';

// Read-aloud for the shisa stories with the device's own Mandarin voice (Web Speech API, works offline on most devices).

/**
 * What the voice should say: a reading with the Japanese word after it in brackets, 「西薩（シーサー）」, is said as
 * the reading alone, and any other kana is dropped, since a Mandarin voice can't pronounce it.
 */
export function speakable(text: string): string {
  return text.replace(/（[\u3040-\u30FF]+）/g, '').replace(/[\u3040-\u30FF]+/g, '');
}

export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function voice(): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  const zh = all.filter((v) => /^zh|cmn/i.test(v.lang));
  return zh.find((v) => /TW|Hant/i.test(v.lang)) ?? zh.find((v) => !/HK|yue/i.test(v.lang)) ?? zh[0];
}

let session = 0;

export function stopSpeaking(): void {
  if (!canSpeak()) return;
  session++;
  window.speechSynthesis.cancel();
  holdMusicDown(false);
}

/** How a line is said: the calm storyteller, or a shisa itself, higher and livelier */
export type Voice = 'narrator' | 'shisa';
const TONE: Record<Voice, { rate: number; pitch: number }> = {
  narrator: { rate: 0.92, pitch: 1.05 },
  shisa: { rate: 1.05, pitch: 1.7 },
};

/**
 * Reads the text aloud a sentence at a time (some engines cut long utterances short); `done` fires at the end or on
 * stop. Respects the sound-effects switch only through the caller.
 */
export function speak(text: string, done: () => void = () => {}, as: Voice = 'narrator'): void {
  if (!canSpeak()) {
    done();
    return;
  }
  stopSpeaking();
  const id = ++session;
  const parts = speakable(text)
    .split(/(?<=[。！？])/)
    .map((p) => p.trim())
    .filter(Boolean);
  const v = voice();
  holdMusicDown(true);
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = v?.lang ?? 'zh-TW';
    if (v) u.voice = v;
    u.rate = TONE[as].rate;
    u.pitch = TONE[as].pitch;
    const end = () => {
      if (id !== session) return;
      if (i === parts.length - 1) {
        holdMusicDown(false);
        done();
      }
    };
    u.onend = end;
    u.onerror = () => {
      if (id !== session) return;
      holdMusicDown(false);
      done();
    };
    window.speechSynthesis.speak(u);
  });
}

let unlocked = false;
/**
 * iPhone and iPad only let a page speak after a tap has started speech once; an empty line during the first tap
 * unlocks it, so later lines (a shisa greeting on a win) can play on their own.
 */
export function installSpeechUnlock(): () => void {
  const unlock = () => {
    if (unlocked || !canSpeak()) return;
    unlocked = true;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    window.removeEventListener('pointerup', unlock, true);
  };
  window.addEventListener('pointerup', unlock, true);
  return () => window.removeEventListener('pointerup', unlock, true);
}

/** A read-aloud toggle for one text; stops when the text changes or the component goes away */
export function useReadAloud(text: string): { supported: boolean; speaking: boolean; toggle: () => void } {
  const [speaking, setSpeaking] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: stop whenever the text being read changes
  useEffect(() => {
    return () => {
      stopSpeaking();
      setSpeaking(false);
    };
  }, [text]);
  return {
    supported: canSpeak(),
    speaking,
    toggle: () => {
      if (speaking) {
        stopSpeaking();
        setSpeaking(false);
      } else {
        setSpeaking(true);
        speak(text, () => setSpeaking(false));
      }
    },
  };
}
