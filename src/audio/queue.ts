import { zonesBeen } from '../content/places';
import { SONGS, type SongId } from './songs';

// Outside a journey (the title, the map, the gacha machines, the collection) one queue of songs keeps playing whatever
// screen is up: the game's own songs first, then the song of every zone the player has been to, in the order of the loop
// around Okinawa. Each song plays for about a minute and a half, then the next one starts.

/** The songs that always open the queue, the game's theme first so it greets the title screen */
export const LOBBY_SONGS: SongId[] = ['theme', 'shimakaze', 'michi'];

/** About how long each song in the queue plays, in seconds; it always ends at the end of a time through */
export const LOBBY_SECONDS = 90;

/** The queue for a player: the game's songs, then the songs of the zones with at least one stop cleared */
export function lobbyQueue(seen: string[], clears: Record<string, number>): SongId[] {
  const been = zonesBeen(seen, clears).map((Z) => Z.bgm);
  return [...LOBBY_SONGS, ...been.filter((id) => !LOBBY_SONGS.includes(id))];
}

/** Seconds for one time through a song */
export const songSeconds = (id: SongId): number => (SONGS[id].beats * 60) / SONGS[id].bpm;

/** How many times through a song makes about LOBBY_SECONDS, at least once */
export const lobbyLoops = (id: SongId): number => Math.max(1, Math.round(LOBBY_SECONDS / songSeconds(id)));

/** The song after this one in the queue, back to the top after the last; a song no longer in the queue starts it over */
export function nextInQueue(queue: SongId[], id: SongId): SongId {
  const i = queue.indexOf(id);
  return queue[i < 0 ? 0 : (i + 1) % queue.length];
}
