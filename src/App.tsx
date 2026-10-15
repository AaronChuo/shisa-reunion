import { useEffect } from 'react';
import { installAudioUnlock } from './audio/sfx';
import { DragLayer } from './game/Tray';
import { ModalHost } from './modals/ModalHost';
import { Dex } from './screens/Dex';
import { Gacha } from './screens/Gacha';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { useGame } from './state/store';

export function App() {
  const screen = useGame((s) => s.ui.screen);
  // Browsers only allow sound after a tap; on touch screens that means when the finger lifts
  useEffect(() => installAudioUnlock(), []);
  return (
    <>
      {screen === 'home' && <Home />}
      {screen === 'play' && <Play />}
      {screen === 'gacha' && <Gacha />}
      {screen === 'dex' && <Dex />}
      <ModalHost />
      <DragLayer />
    </>
  );
}
