// Background music. Nine traditional Okinawan songs (public domain, melody only, transposed to C) and seven originals
// in the Ryukyu scale. Eight were read from the melody line of mu-tech.org's MIDI files; the Kume song from a printed
// kunkunshi of 1925, checked against a Meiji-era manuscript.

export interface NoteEvent {
  note: string;
  /** Start, in beats from the top of the song */
  beat: number;
  /** Length in beats */
  len: number;
  /** Slide up from a semitone below, as sanshin players often do */
  slide: boolean;
  accent: boolean;
}

export type PercPattern = 'calm' | 'lively' | 'eisa';

export interface Song {
  name: string;
  bpm: number;
  perc: PercPattern;
  events: NoteEvent[];
  beats: number;
}

/** "note:beats" tokens; "~" = slide, "r" = rest, "|" = bar line (ignored) */
export function parseMelody(src: string): { events: NoteEvent[]; beats: number } {
  const events: NoteEvent[] = [];
  let beat = 0;
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [n, len] = tok.split(':');
    const beats = Number.parseFloat(len);
    if (n !== 'r') events.push({ note: n.replace('~', ''), slide: n.includes('~'), beat, len: beats, accent: beat % 4 === 0 });
    beat += beats;
  }
  return { events, beats: beat };
}

const song = (name: string, bpm: number, perc: PercPattern, melody: string): Song => ({ name, bpm, perc, ...parseMelody(melody) });

export const SONGS = {
  shimakaze: song(
    '島風',
    84,
    'calm',
    `E4:1 F4:.5 G4:.5 B4~:1 G4:1 | C5:1.5 B4:.5 G4:2 | F4:1 G4:.5 F4:.5 E4:1 C4:1 | E4:1 F4:1 G4:2 |
     B4:1 C5:.5 B4:.5 G4:1 F4:1 | G4~:1.5 F4:.5 E4:2 | C4:.5 E4:.5 F4:1 G4:.5 B4:.5 G4:1 | C5:3 r:1 |
     G4:1 B4:.5 C5:.5 E5~:1 C5:1 | B4:1 G4:.5 F4:.5 G4:2 | E4:.5 F4:.5 G4:.5 B4:.5 C5:1 B4:1 | G4:1 F4:1 E4:2 |
     F4:1 G4:.5 F4:.5 E4:1 C4:1 | E4~:1.5 F4:.5 G4:2 | B4:.5 G4:.5 F4:.5 E4:.5 F4:1 E4:1 | C4:3 r:1`,
  ),
  michi: song(
    '搭路小調',
    112,
    'lively',
    `C5:.5 C5:.5 B4:.5 G4:.5 F4:.5 G4:.5 B4:1 | C5:.5 E5:.5 C5:.5 B4:.5 G4:2 |
     F4:.5 G4:.5 F4:.5 E4:.5 C4:.5 E4:.5 F4:1 | G4:.5 B4:.5 G4:.5 F4:.5 E4:2 |
     E5:.5 F5:.5 E5:.5 C5:.5 B4:.5 C5:.5 G4:1 | F4:.5 G4:.5 B4:.5 C5:.5 B4~:1 G4:1 |
     F4:.5 E4:.5 F4:.5 G4:.5 B4:.5 G4:.5 F4:.5 E4:.5 | C4:1 E4:.5 F4:.5 G4:.5 B4:.5 C5:1`,
  ),
  tensagu: song(
    'てぃんさぐぬ花',
    80,
    'calm',
    `E4:1.5 E4:0.5 F4:0.5 E4:0.5 D4:1 | C4:1.5 B3:0.5 C4:1 C4:1 | E4:1 G4:0.5 G4:0.5 B4:1 D5:1 | C5:2 B4:1 C5:1 |
     E4:1 E4:0.5 E4:0.5 F4:0.5 E4:0.5 D4:1 | C4:1.5 B3:0.5 C4:1 C4:1 | E4:1 G4:0.5 G4:0.5 F4:0.5 E4:0.5 D4:1 | C4:2 r:2 |
     E4:1.5 E4:0.5 F4:0.5 E4:0.5 D4:1 | C4:1.5 B3:0.5 C4:1 C4:1 | E4:1 G4:0.5 G4:0.5 B4:1 D5:1 | C5:2 B4:1 C5:1 |
     E4:1 E4:0.5 E4:0.5 F4:0.5 E4:0.5 D4:1 | C4:1.5 B3:0.5 C4:1 C4:1 | E4:1 E4:0.5 G4:0.5 F4:0.5 E4:0.5 D4:1 | C4:2 r:2`,
  ),
  akata: song(
    '赤田首里殿內',
    100,
    'lively',
    `C4:1 C4:0.5 E4:0.5 G4:1.5 B4:0.5 | F4:1 E4:0.5 F4:0.5 G4:2 | C4:1 C4:0.5 E4:0.5 G4:1.5 B4:0.5 | F4:1 E4:0.5 F4:0.5 G4:2 |
     C4:1 C4:0.5 E4:0.5 G4:1.5 B4:0.5 | F4:1 E4:0.5 F4:0.5 G4:2 | C4:1 C4:0.5 E4:0.5 G4:1.5 B4:0.5 | F4:1 E4:0.5 F4:0.5 G4:2.5
     D4:0.5 E4:0.5 G4:0.5 G4:1 G4:2 G4:0.5 F4:0.5 F4:1 F4:0.5 E4:1 F4:0.5 F4:0.5 G4:0.5 B4:1 G4:1 | F4:1 E4:1 F4:1 r:1.5
     E4:0.5 E4:0.5 E4:0.5 F4:0.5 E4:0.5 D4:1 | C4:1 D4:1 C4:1 C4:1.5 G4:0.5 G4:0.5 G4:0.5 F4:1 E4:0.5 F4:0.5 | G4:2 r:2 |
     G4:1.5 B4:0.5 F4:1 E4:0.5 F4:0.5 | G4:2 C4:1 C4:0.5 E4:0.5 | G4:1.5 B4:0.5 F4:1 E4:0.5 F4:0.5 | G4:2 C4:1 C4:0.5 E4:0.5 |
     G4:1.5 B4:0.5 F4:1 E4:0.5 F4:0.5 | G4:2 C4:1 C4:0.5 E4:0.5 | G4:1.5 B4:0.5 F4:1 E4:0.5 F4:0.5 | G4:2 C4:1 C4:0.5 E4:0.5`,
  ),
  tanchame: song(
    '谷茶前',
    92,
    'eisa',
    `r:0.5 E4:0.5 E4:0.5 E4:1 G4:1 E4:1 G4:1 B4:1 B4:1 C5:1 G4:1 B4:1 C5:0.5 C5:0.5 B4:0.5 | G4:1.5 G4:1 B4:0.5 B4:0.75 C5:0.25 |
     G4:1 F4:1 E4:1 C4:1.5 F4:1 E4:0.5 F4:0.5 G4:0.5 E4:1.5 G4:1 B4:0.5 B4:0.25 C5:0.75 G4:1 | F4:1 E4:1 C4:0.5 E4:0.5 E4:0.5 E4:0.5 |
     F4:0.5 D4:0.5 C4:0.5 C4:1 B4:0.5 G4:0.5 G4:0.5 | F4:0.5 E4:0.5 C4:0.5 C4:0.5 C4:0.5 E4:0.5 E4:0.5 E4:0.5 |
     F4:0.5 E4:0.5 C4:0.5 C4:1 B4:0.5 C5:0.5 B4:0.5 | F4:0.5 G4:0.5 F4:0.5 G4:1 E4:0.5 E4:0.5 E4:1 G4:1 E4:1 G4:1 B4:1 B4:1 C5:1
     G4:1 B4:1 C5:0.5 C5:0.5 B4:0.5 G4:1.5 G4:1 B4:0.5 B4:0.75 C5:0.25 G4:1 F4:1 | E4:1 C4:1.5 F4:1 E4:0.5 | F4:0.5 G4:0.5 E4:1.5 G4:1 B4:0.5 |
     B4:0.25 C5:0.75 G4:1 F4:1 E4:1 | C4:0.5 E4:0.5 E4:0.5 E4:0.5 F4:0.5 D4:0.5 C4:0.5 C4:1 B4:0.5 G4:0.5 G4:0.5 F4:0.5 E4:0.5 C4:0.5 C4:0.5 |
     C4:0.5 E4:0.5 E4:0.5 E4:0.5 F4:0.5 E4:0.5 C4:0.5 C4:1 B4:0.5 C5:0.5 B4:0.5 F4:0.5 G4:0.5 F4:0.5 G4:0.5`,
  ),
  asadoya: song(
    '安里屋ユンタ',
    72,
    'calm',
    `D4:1 E4:0.75 G4:0.25 E4:1 D4:0.75 C4:0.25 | C4:1 D4:0.5 E4:0.5 G4:1 G4:0.75 A4:0.25 | G4:1 G4:1 A4:1 A4:1 |
     G4:1 A4:0.75 C5:0.25 A4:1 G4:0.75 E4:0.25 | D4:1 E4:0.75 A4:0.25 G4:0.75 E4:0.25 D4:0.75 C4:0.25 |
     C4:1 C4:0.75 C4:0.25 D4:1 E4:0.75 D4:0.25 | G3:1 G3:0.5 A3:0.5 C4:0.5 E4:0.5 D4:0.5 D4:0.5 | C4:1 r:1 D4:1 E4:0.5 D4:0.5 |
     G3:1 G3:0.5 A3:0.5 C4:0.5 E4:0.5 D4:1 | C4:1 C4:1 D4:1 E4:0.75 G4:0.25 | E4:1 D4:0.75 C4:0.25 C4:1 D4:0.5 E4:0.5 |
     G4:1 G4:0.75 A4:0.25 G4:1 G4:1 | A4:1 A4:1 G4:1 A4:0.75 C5:0.25 | A4:1 G4:0.75 E4:0.25 D4:1 E4:0.75 A4:0.25 |
     G4:0.75 E4:0.25 D4:0.75 C4:0.25 C4:1 C4:0.75 C4:0.25 | D4:1 E4:0.75 D4:0.25 G3:1 G3:0.5 A3:0.5 |
     C4:0.5 E4:0.5 D4:0.5 D4:0.5 C4:1 r:1 | D4:1 E4:0.5 D4:0.5 G3:1 G3:0.5 A3:0.5 | C4:0.5 E4:0.5 D4:1 C4:1 C4:1`,
  ),
  toshin: song(
    '唐船ドーイ',
    112,
    'eisa',
    `F5:1 F5:0.75 F5:0.25 F5:1 F5:1 | F5:0.75 F5:0.25 D5:1 D5:0.75 D5:0.25 C5:1.5 B4:0.5 C5:0.75 C5:0.25 C5:1 D5:1 |
     F5:0.75 F5:0.25 D5:0.75 D5:1 C5:1 D5:0.25 | C5:0.75 B4:0.25 G4:0.75 G4:0.25 F4:0.75 F4:1.25 | E4:0.75 F4:0.25 G4:1 r:1 B4:1 |
     C5:2 B4:1 C5:2 B4:1 G4:1 B4:0.75 B4:0.25 | C5:0.75 D5:0.75 G4:1 B4:0.5 F4:0.75 E4:0.25 | F4:0.75 D4:0.25 C4:1 r:0.75 B4:0.25 B4:0.75 B4:0.25 |
     C5:0.75 C5:0.25 C5:0.75 G4:0.25 r:0.75 E4:0.25 F4:0.75 D4:0.25 | C4:1 r:3`,
  ),
  densa: song(
    'デンサー節',
    76,
    'calm',
    `G3:0.25 G3:0.25 G3:0.5 G3:1 G3:0.5 C4:0.5 C4:0.5 E4:0.5 | D4:0.75 G4:0.25 G4:1.5 A4:0.5 G4:0.75 E4:0.25 |
     E4:0.5 G4:0.5 D4:0.75 C4:0.25 D4:0.5 G4:0.5 G4:0.5 E4:0.5 | D4:0.5 D4:0.5 C4:1 r:1 D4:0.75 E4:0.25 | C4:0.5 A3:0.5 G3:1 G3:1 r:1 |
     C4:0.75 E4:0.25 D4:1 E4:0.75 G4:0.25 G4:0.25 G4:0.5 A4:0.25 | G4:0.5 E4:0.25 G4:0.25 D4:0.75 C4:0.25 D4:0.5 E4:0.5 G3:1 | C4:1 r:3`,
  ),
  hana: song(
    '花ぬ風車',
    84,
    'calm',
    `r:0.5 C4:0.5 E4:1 F4:3 F4:0.5 B4:0.5 G4:1 G4:1 | F4:2 D4:1 F4:0.5 F4:0.5 | r:1 D4:1 C4:1 D4:0.5 C4:0.5 |
     B3:1 G3:1 B3:1 C4:2 C4:0.5 F4:0.5 D4:1 B3:1 | C4:2 C4:1 B3:1 | C4:1 D4:1 F4:1 B3:1 | C4:2 F4:0.5 F4:0.5 E4:0.5 E4:0.5 |
     F4:0.5 F4:0.5 G4:1 B4:0.5 B4:0.5 E4:0.5 E4:0.5 | F4:2 r:2`,
  ),
  // Miyako's harvest song: an old ayagu with no named author. Melody only; the long holds are kept as held notes
  hounen: song(
    '豊年の歌',
    72,
    'calm',
    `C4:0.25 C4:0.75 C4:1 F4:1.75 A4:0.25 | G4:1.75 F4:0.25 G4:1 A4:0.75 C5:1 C5:3.25 |
     C5:0.25 C5:0.75 C5:0.75 D5:0.25 C5:1 A4:0.75 G4:0.25 | F4:1 G4:0.75 A4:0.25 G4:1 F4:0.75 D4:0.25 |
     C4:0.75 C4:1 A3:0.25 C4:1 D4:0.75 F4:1 F4:2 r:2 G4:1 G4:0.25 G4:0.75 C5:1 A4:1 G4:1 F4:0.25 G4:1 A4:0.75 C5:1 C5:3.25 |
     C5:1 C5:1 C5:1 A4:0.75 G4:0.25 | F4:1.75 A4:0.25 G4:1 F4:0.75 D4:0.25 | C4:0.75 C4:1 A3:0.25 C4:1 D4:0.75 F4:1 F4:2 r:1.25`,
  ),
  // Original, for Nakagusuku: phrases that climb and come back down, like the castle's stone arch
  arch: song(
    '石拱門',
    92,
    'lively',
    `C4:1 E4:1 G4:1 B4:1 | C5:2 B4:1 G4:1 | F4:1 G4:.5 F4:.5 E4:1 F4:1 | G4:3 r:1 |
     C4:1 E4:1 G4:1 B4:1 | C5:1 E5:1 C5:1 B4:1 | G4:1 F4:.5 G4:.5 E4:1 F4:1 | C4:3 r:1 |
     G4:.5 B4:.5 C5:1 B4:.5 G4:.5 F4:1 | G4:.5 B4:.5 C5:1 E5:2 | C5:.5 B4:.5 G4:1 F4:.5 E4:.5 F4:1 | G4~:3 r:1 |
     E4:1 F4:.5 G4:.5 B4:1 C5:1 | B4:1 G4:1 F4:1 E4:1 | F4:.5 G4:.5 F4:.5 E4:.5 C4:1 E4:1 | C4:3 r:1`,
  ),
  // Original, for American Village: a bouncy walk along the seawall towards the sunset
  sunset: song(
    '夕陽海堤',
    104,
    'lively',
    `C5:.5 B4:.5 G4:1 E4:.5 F4:.5 G4:1 | B4:.5 C5:.5 B4:.5 G4:.5 F4:2 | E4:.5 F4:.5 G4:.5 B4:.5 C5:1 B4:1 | G4:3 r:1 |
     C5:.5 B4:.5 G4:1 E4:.5 F4:.5 G4:1 | B4:.5 C5:.5 E5:.5 C5:.5 B4:2 | G4:.5 F4:.5 E4:.5 F4:.5 G4:1 F4:1 | C4:3 r:1 |
     E4:1 G4:.5 B4:.5 C5:1 E5:1 | F5:.5 E5:.5 C5:.5 B4:.5 C5:2 | B4:.5 G4:.5 F4:.5 G4:.5 B4:1 C5:1 | G4~:3 r:1 |
     E4:.5 F4:.5 G4:1 B4:.5 G4:.5 F4:1 | E4:.5 F4:.5 G4:.5 B4:.5 C5:2 | B4:.5 G4:.5 F4:.5 E4:.5 F4:1 E4:1 | C4:3 r:1`,
  ),
  // Original, for Onna: long, open phrases, like the wind over the grass on top of Manzamo's cliff
  manzamo: song(
    '萬座毛',
    76,
    'calm',
    `G4:2 B4:1 C5:1 | E5~:2 C5:1 B4:1 | G4:1 F4:.5 G4:.5 B4:1 G4:1 | F4:3 r:1 |
     E4:1 F4:1 G4:1 B4:1 | C5:1.5 B4:.5 G4:2 | F4:1 E4:.5 F4:.5 G4:1 F4:1 | E4:3 r:1 |
     C5:2 E5:1 C5:1 | B4:1 G4:1 B4:1 C5:1 | G4:1 F4:.5 E4:.5 F4:1 G4:1 | B4~:3 r:1 |
     C5:1 B4:.5 G4:.5 F4:1 E4:1 | F4:1 G4:1 B4:2 | G4:1 F4:.5 E4:.5 C4:1 E4:1 | C4:3 r:1`,
  ),
  // Original, for the Kaichu Road: a steady run of eighths, like driving across the sea
  kaichu: song(
    '海上的路',
    108,
    'eisa',
    `C4:.5 E4:.5 F4:.5 G4:.5 B4:1 G4:1 | C5:.5 B4:.5 G4:.5 F4:.5 G4:2 | C4:.5 E4:.5 F4:.5 G4:.5 B4:1 C5:1 | B4:.5 G4:.5 F4:.5 E4:.5 F4:2 |
     G4:1 G4:.5 B4:.5 C5:1 C5:1 | E5:.5 C5:.5 B4:.5 G4:.5 B4:2 | G4:.5 F4:.5 E4:.5 F4:.5 G4:1 B4:1 | C5:3 r:1 |
     E5:1 C5:.5 B4:.5 G4:1 B4:1 | C5:.5 B4:.5 G4:.5 F4:.5 E4:2 | F4:1 G4:.5 F4:.5 E4:1 C4:1 | E4:.5 F4:.5 G4:1 B4:2 |
     C5:.5 C5:.5 B4:.5 G4:.5 F4:1 G4:1 | B4:.5 C5:.5 B4:.5 G4:.5 F4:2 | E4:.5 F4:.5 G4:.5 F4:.5 E4:1 F4:1 | C4:3 r:1`,
  ),
  // Original, for Nanjo: slow and still, looking out east over the sea to Kudaka, the island of the gods
  nirai: song(
    '東方的海',
    70,
    'calm',
    `C4:1 E4:1 F4:2 | G4~:2 F4:1 E4:1 | F4:1 G4:1 B4:1 G4:1 | F4:3 r:1 |
     C4:1 E4:1 F4:1 G4:1 | B4~:2 C5:1 B4:1 | G4:1 F4:.5 G4:.5 F4:1 E4:1 | C4:3 r:1 |
     G4:1 B4:1 C5:2 | E5~:1.5 C5:.5 B4:2 | C5:1 B4:.5 G4:.5 F4:1 G4:1 | B4:3 r:1 |
     C5:1 B4:1 G4:1 F4:1 | E4:1 F4:.5 E4:.5 C4:2 | E4:1 F4:1 G4:.5 F4:.5 E4:1 | C4:3 r:1`,
  ),
  // The song of Kume's Aka village, from Oshiro Hikogoro's Ryukyu Gakuten Kunkunshi (1925), supplement pp. 12–13: one
  // cell a beat, the small characters as the second half of a beat, an empty circle (string not plucked) holding the
  // note before. The closing rest rounds it to whole bars
  kumeaka: song(
    '久米阿嘉節',
    84,
    'calm',
    `G4:1 E4:.5 F4:.5 G4:1.5 B4:.5 | G4:1 E4:.5 F4:.5 G4:2 | G4:1 E4:.5 F4:.5 G4:2 | G4:1 B4:1 G4:2 |
     F4:1 E4:1 C4:2 | C4:1 E4:1 F4:2 | E4:1 F4:1 G4:1 F4:1 | E4:1 F4:1 G4:1 B4:1 | C5:2 C5:1 C4:.5 B4:.5 |
     C5:1 D5:1 C5:1 B4:1 | G4:1 B4:1 C5:1 G4:1 | F4:1 E4:1 C4:2 | F4:1 G4:1 F4:1 D4:1 |
     C4:1.5 B4:.5 G4:1 E4:.5 F4:.5 | G4:1 r:3`,
  ),
} satisfies Record<string, Song>;

export type SongId = keyof typeof SONGS;

/** Percussion hits per bar: [beat, instrument, velocity] */
export const PERC: Record<PercPattern, [number, 'taiko' | 'sanba', number][]> = {
  calm: [
    [0, 'taiko', 0.6],
    [2.5, 'sanba', 0.6],
  ],
  lively: [
    [0, 'taiko', 0.85],
    [1.5, 'sanba', 1],
    [2, 'taiko', 0.5],
    [3.5, 'sanba', 0.6],
  ],
  // Eisa dance feel: drum on every beat, clappers rattling on the off-beats
  eisa: [
    [0, 'taiko', 0.9],
    [0.5, 'sanba', 0.6],
    [1, 'taiko', 0.5],
    [1.5, 'sanba', 1],
    [2, 'taiko', 0.8],
    [2.5, 'sanba', 0.6],
    [3, 'taiko', 0.5],
    [3.5, 'sanba', 1],
  ],
};

/** What plays where: the map, the gacha and collection screens, and each zone's journey */
export const HOME_SONG: SongId = 'shimakaze';
export const SHOP_SONG: SongId = 'michi';
