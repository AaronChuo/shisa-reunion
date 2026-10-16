import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from '../art/Icons';

/** Offers a reload when a new version has been downloaded, and confirms once the game works offline */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();
  if (needRefresh) {
    return (
      <div className="notice" role="status">
        <span>有新版本可以更新了</span>
        <button type="button" className="iconBtn primary" onClick={() => void updateServiceWorker(true)}>
          <Icon name="refresh" />
          <span>更新</span>
        </button>
        <button type="button" className="iconBtn" onClick={() => setNeedRefresh(false)}>
          等一下
        </button>
      </div>
    );
  }
  if (offlineReady) {
    return (
      <div className="notice" role="status">
        <span>已經存好，沒有網路也能玩</span>
        <button type="button" className="iconBtn" onClick={() => setOfflineReady(false)}>
          <Icon name="check" />
          <span>好</span>
        </button>
      </div>
    );
  }
  return null;
}
