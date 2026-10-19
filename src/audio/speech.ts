import { useEffect, useState } from 'react';
import { audioCtx, audioRunning, holdMusicDown, voiceOut } from './context';
import { speakable, type Voice, voiceKey } from './voice';
import recorded from './voices.json';

// Read-aloud: the recorded Azure narration when a line has one (voice.ts), otherwise the device's own Mandarin voice
// (Web Speech API, works offline on most devices).

export { speakable, type Voice } from './voice';

const RECORDED = new Set<string>(recorded);
const hasRecording = (text: string, as: Voice): boolean => RECORDED.has(voiceKey(text, as));

export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function deviceVoice(): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis.getVoices();
  const zh = all.filter((v) => /^zh|cmn/i.test(v.lang));
  return zh.find((v) => /TW|Hant/i.test(v.lang)) ?? zh.find((v) => !/HK|yue/i.test(v.lang)) ?? zh[0];
}

let session = 0;
let playing: AudioBufferSourceNode | null = null;
// A decoded clip takes about 100 KB a second of memory, so only the last few are kept (the short shisa lines come back
// most often); the files themselves stay in the offline cache
const decoded = new Map<string, Promise<AudioBuffer>>();
const KEEP_DECODED = 6;

export function stopSpeaking(): void {
  session++;
  if (playing) {
    playing.onended = null;
    playing.stop();
    playing = null;
  }
  if (canSpeak()) window.speechSynthesis.cancel();
  holdMusicDown(false);
}

/** The device voice's tone for each kind of line, close to the recordings */
const TONE: Record<Voice, { rate: number; pitch: number }> = {
  narrator: { rate: 0.92, pitch: 1.05 },
  shisa: { rate: 1.05, pitch: 1.7 },
};

/** Reads with the device voice a sentence at a time (some engines cut long utterances short) */
function speakWithDevice(text: string, id: number, done: () => void, as: Voice): void {
  if (!canSpeak()) {
    holdMusicDown(false);
    done();
    return;
  }
  const parts = speakable(text)
    .split(/(?<=[。！？])/)
    .map((p) => p.trim())
    .filter(Boolean);
  const v = deviceVoice();
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

/** Plays a recording through the game's audio; falls back to the device voice if it can't be loaded */
function playRecording(text: string, id: number, done: () => void, as: Voice): void {
  const ctx = audioCtx();
  const out = voiceOut();
  if (!ctx || !out) {
    speakWithDevice(text, id, done, as);
    return;
  }
  const key = voiceKey(text, as);
  let buf = decoded.get(key);
  if (buf) decoded.delete(key);
  else {
    buf = fetch(`/voice/${key}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`voice ${key}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((a) => ctx.decodeAudioData(a));
    // A failed load is tried again next time rather than remembered
    buf.catch(() => decoded.delete(key));
  }
  // Most recently used last; the oldest goes once there are too many
  decoded.set(key, buf);
  if (decoded.size > KEEP_DECODED) decoded.delete(decoded.keys().next().value as string);
  holdMusicDown(true);
  buf.then(
    (b) => {
      if (id !== session) return;
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.connect(out);
      src.onended = () => {
        if (id !== session) return;
        playing = null;
        holdMusicDown(false);
        done();
      };
      playing = src;
      src.start();
    },
    () => {
      if (id === session) speakWithDevice(text, id, done, as);
    },
  );
}

/**
 * Reads the text aloud; `done` fires at the end or on stop. Respects the sound-effects switch only through the
 * caller. Recordings need the game's audio running, which the first tap starts; before that the device voice reads.
 */
export function speak(text: string, done: () => void = () => {}, as: Voice = 'narrator'): void {
  stopSpeaking();
  const id = session;
  if (hasRecording(text, as) && audioRunning()) playRecording(text, id, done, as);
  else speakWithDevice(text, id, done, as);
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
    supported: hasRecording(text, 'narrator') || canSpeak(),
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
