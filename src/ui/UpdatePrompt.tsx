import { useRegisterSW } from 'virtual:pwa-register/react';

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
          更新
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
          好
        </button>
      </div>
    );
  }
  return null;
}
