import { useEffect } from 'react';
import { installAudioUnlock } from './audio/context';
import { installMusic, setLobby, setScene } from './audio/music';
import type { SongId } from './audio/songs';
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
import { Title } from './screens/Title';
import { type GameState, getState, useGame } from './state/store';
import { Opening } from './story/Opening';

/** What plays for what is on screen: the current zone's song on a journey, the queue everywhere else */
function sceneOf(s: GameState): string {
  const run = s.progress.run;
  if (s.ui.screen === 'play' && run) return `${ZONES[run.zi].bgm}${run.si === STAGES - 1 ? '-boss' : ''}`;
  return 'lobby';
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
  // known, the story introduces the two shisa. Both wait for the title screen (enterGame), unless this visit is past it.
  useEffect(() => {
    const { progress: p, ui } = getState();
    if (ui.screen !== 'title' && p.age !== null && !p.seen.includes('story')) openStory();
  }, []);
  const story = useGame((s) => s.ui.story);
  // While nobody has said who is playing, a grown-up is asked
  const modal = useGame((s) => s.ui.modal);
  const age = useGame((s) => s.progress.age);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-check whenever the screen, a modal, the story or the age changes
  useEffect(() => askAgeIfNeeded(), [screen, modal, story, age]);
  useEffect(() => {
    if (scene === 'lobby') return setLobby();
    const [id, boss] = scene.split('-');
    setScene(id as SongId, boss === 'boss');
  }, [scene]);
  return (
    <>
      {screen === 'title' && <Title />}
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
