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

/** Reads the text aloud a sentence at a time (some engines cut long utterances short); `done` fires at the end or on stop */
export function speak(text: string, done: () => void): void {
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
    u.rate = 0.92;
    u.pitch = 1.05;
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
