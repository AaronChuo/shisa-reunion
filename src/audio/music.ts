import { useGame } from '../state/store';
import { audioCtx, musicCrossfade, onAudioState, pluck, sanba, taiko } from './context';
import { lobbyLoops, lobbyQueue, nextInQueue } from './queue';
import { PERC, SONGS, type SongId } from './songs';

// Background music: a look-ahead scheduler on the music bus. On a journey it loops the zone's song, a little faster
// with the Eisa drum pattern on the final stop. Everywhere else it plays the queue (see queue.ts), which carries on
// across screens and picks up again at the song it was on after a journey.

interface Scene {
  id: SongId;
  boss: boolean;
  /** Part of the queue: plays its share of times through, then hands over to the next song */
  lobby: boolean;
}

/** The pause between one song of the queue and the next, in seconds */
const GAP = 1;

let want: Scene | null = null;
let now: Scene | null = null;
/** The song the queue is on, kept while a journey plays its own */
let lobbySong: SongId | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
let start = 0;
let idx = 0;
let loop = 0;
let step = 0;

const same = (a: Scene | null, b: Scene | null) => !!a && !!b && a.id === b.id && a.boss === b.boss && a.lobby === b.lobby;

const queueNow = (): SongId[] => {
  const p = useGame.getState().progress;
  return lobbyQueue(p.seen, p.clears);
};

function show(s: Scene | null): void {
  document.documentElement.dataset.bgm = s ? `${s.id}${s.boss ? '-boss' : ''}` : '';
  document.documentElement.dataset.queue = s?.lobby ? 'lobby' : '';
}

/** A zone's song for a journey, or nothing; it starts as soon as audio is allowed and music is switched on */
export function setScene(id: SongId | null, boss = false): void {
  want = id ? { id, boss, lobby: false } : null;
  show(want);
  sync();
}

/** The queue, at the song it was on (the top of the queue the first time) */
export function setLobby(): void {
  const queue = queueNow();
  if (!lobbySong || !queue.includes(lobbySong)) lobbySong = queue[0];
  want = { id: lobbySong, boss: false, lobby: true };
  show(want);
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
  // A song of the queue stops after its share of times through; a journey's song goes round for as long as it is wanted
  const loops = now.lobby ? lobbyLoops(now.id) : Number.POSITIVE_INFINITY;
  const end = start + loops * song.beats * spb;
  while (loop < loops) {
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
    if (t > ahead || t >= end) break;
    const pos = (step * 0.5) % 4;
    for (const [b, kind, v] of perc) {
      if (b !== pos) continue;
      if (kind === 'taiko') taiko('music', t, v);
      else sanba('music', t, v, v > 0.9 ? 3 : 1);
    }
    step += 1;
  }
  // Its last time through is all scheduled: the next song of the queue follows after a short breath, no fade needed
  if (loop >= loops && end <= ahead) {
    lobbySong = nextInQueue(queueNow(), now.id);
    now = want = { id: lobbySong, boss: false, lobby: true };
    show(now);
    start = end + GAP;
    idx = 0;
    loop = 0;
    step = 0;
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
