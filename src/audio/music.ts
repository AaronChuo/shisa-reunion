import { useGame } from '../state/store';
import { audioCtx, musicCrossfade, onAudioState, pluck, sanba, taiko } from './context';
import { PERC, SONGS, type SongId } from './songs';

// Background music: a look-ahead scheduler that loops the scene's song on the music bus.
// Final stops play the zone's song a little faster with the Eisa drum pattern.

interface Scene {
  id: SongId;
  boss: boolean;
}

let want: Scene | null = null;
let now: Scene | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let start = 0;
let idx = 0;
let loop = 0;
let step = 0;

const same = (a: Scene | null, b: Scene | null) => !!a && !!b && a.id === b.id && a.boss === b.boss;

/** Chooses what should play; it starts as soon as audio is allowed and music is switched on */
export function setScene(id: SongId | null, boss = false): void {
  want = id ? { id, boss } : null;
  document.documentElement.dataset.bgm = id ? `${id}${boss ? '-boss' : ''}` : '';
  sync();
}

export const currentSongName = (): string | null => (want ? SONGS[want.id].name : null);

function stop(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
  now = null;
}

function sync(): void {
  const ctx = audioCtx();
  const on = useGame.getState().progress.music;
  if (!want || !on || !ctx || ctx.state !== 'running' || document.hidden) {
    stop();
    return;
  }
  if (same(now, want) && timer) return;
  const fresh = !now;
  stop();
  now = want;
  start = ctx.currentTime + (fresh ? 0.15 : 0.45);
  if (!fresh) musicCrossfade(start);
  idx = 0;
  loop = 0;
  step = 0;
  timer = setInterval(tick, 25);
  tick();
}

function tick(): void {
  const ctx = audioCtx();
  if (!ctx || !now) return;
  const song = SONGS[now.id];
  const spb = 60 / (song.bpm * (now.boss ? 1.08 : 1));
  const perc = PERC[now.boss ? 'eisa' : song.perc];
  const ahead = ctx.currentTime + 0.15;
  for (;;) {
    const ev = song.events[idx];
    const t = start + (loop * song.beats + ev.beat) * spb;
    if (t > ahead) break;
    const human = (Math.random() - 0.5) * 0.012;
    const vel = (ev.accent ? 1 : 0.82) * (0.95 + Math.random() * 0.1);
    pluck('music', 'soft', ev.note, Math.max(ctx.currentTime, t + human), ev.len * spb, { vel, slide: ev.slide ? -1 : 0 });
    idx += 1;
    if (idx >= song.events.length) {
      idx = 0;
      loop += 1;
    }
  }
  for (;;) {
    const t = start + step * 0.5 * spb;
    if (t > ahead) break;
    const pos = (step * 0.5) % 4;
    for (const [b, kind, v] of perc) {
      if (b !== pos) continue;
      if (kind === 'taiko') taiko('music', t, v);
      else sanba('music', t, v, v > 0.9 ? 3 : 1);
    }
    step += 1;
  }
}

/** Mount once: keeps the music in step with the switch, audio unlock and the page being visible */
export function installMusic(): () => void {
  onAudioState(sync);
  const onVis = () => sync();
  document.addEventListener('visibilitychange', onVis);
  const unsub = useGame.subscribe((s, prev) => {
    if (s.progress.music !== prev.progress.music) sync();
  });
  return () => {
    document.removeEventListener('visibilitychange', onVis);
    unsub();
    stop();
  };
}
