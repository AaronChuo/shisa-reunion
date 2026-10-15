import { useEffect } from 'react';
import { ensureAudio } from './audio/sfx';
import { DragLayer } from './game/Tray';
import { ModalHost } from './modals/ModalHost';
import { Dex } from './screens/Dex';
import { Gacha } from './screens/Gacha';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { useGame } from './state/store';

export function App() {
  const screen = useGame((s) => s.ui.screen);
  useEffect(() => {
    // Browsers only allow sound after the first tap
    const unlock = () => ensureAudio();
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
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
