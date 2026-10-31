import { useEffect } from 'react';
import { installAudioUnlock } from './audio/context';
import { installMusic, setScene } from './audio/music';
import { HOME_SONG, SHOP_SONG, type SongId } from './audio/songs';
import { installSpeechUnlock } from './audio/speech';
import { STAGES, ZONES } from './content/zones';
import { openStory } from './game/actions';
import { askAgeIfNeeded, installPlayClock } from './game/family';
import { DragLayer } from './game/Tray';
import { ModalHost } from './modals/ModalHost';
import { Dex } from './screens/Dex';
import { Gacha } from './screens/Gacha';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { type GameState, getState, useGame } from './state/store';
import { Opening } from './story/Opening';

/** Which song belongs to what is on screen: the map, the shop screens, or the current zone's journey */
function sceneOf(s: GameState): string {
  const run = s.progress.run;
  if (s.ui.screen === 'gacha' || s.ui.screen === 'dex') return SHOP_SONG;
  if (s.ui.screen === 'play' && run) return `${ZONES[run.zi].bgm}${run.si === STAGES - 1 ? '-boss' : ''}`;
  return HOME_SONG;
}

export function App() {
  const screen = useGame((s) => s.ui.screen);
  const scene = useGame(sceneOf);
  // Browsers only allow sound after a tap; on touch screens that means when the finger lifts
  useEffect(() => installAudioUnlock(), []);
  useEffect(() => installMusic(), []);
  useEffect(() => installSpeechUnlock(), []);
  useEffect(() => installPlayClock(), []);
  // The first time the game opens, a grown-up says who is playing (answerAge then plays the story); once that is
  // known, the story introduces the two shisa
  useEffect(() => {
    const p = getState().progress;
    if (p.age !== null && !p.seen.includes('story')) openStory();
  }, []);
  const story = useGame((s) => s.ui.story);
  // While nobody has said who is playing, a grown-up is asked
  const modal = useGame((s) => s.ui.modal);
  const age = useGame((s) => s.progress.age);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-check whenever the screen, a modal, the story or the age changes
  useEffect(() => askAgeIfNeeded(), [screen, modal, story, age]);
  useEffect(() => {
    const [id, boss] = scene.split('-');
    setScene(id as SongId, boss === 'boss');
  }, [scene]);
  return (
    <>
      {screen === 'home' && <Home />}
      {screen === 'play' && <Play />}
      {screen === 'gacha' && <Gacha />}
      {screen === 'dex' && <Dex />}
      <ModalHost />
      <DragLayer />
      {story && <Opening />}
    </>
  );
}
