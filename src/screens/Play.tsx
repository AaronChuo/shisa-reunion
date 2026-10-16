import { CardIcon, CoinIcon, Icon } from '../art/Icons';
import { STAGES, ZONES } from '../content/zones';
import { makeGrid } from '../engine';
import { goHome, openAudioSettings } from '../game/actions';
import { Board } from '../game/Board';
import { useDragController } from '../game/drag';
import { Tray } from '../game/Tray';
import { useGame } from '../state/store';

function Chips() {
  const run = useGame((s) => s.progress.run);
  const lv = run?.level;
  if (!run || !lv) return <div className="chips" />;
  const g = makeGrid(lv, run.placed, run.moves);
  const left = lv.tide ? (g.water >= lv.tide.max ? 0 : lv.tide.every - (run.moves % lv.tide.every)) : 0;
  return (
    <div className="chips">
      {lv.urchin.length > 0 && (
        <span className="chip">
          <CardIcon k="urchin" />
          海膽不能踩
        </span>
      )}
      {lv.tide && (
        <span className="chip">
          <CardIcon k="tide" />
          {left ? (
            <>
              再放 <b className="num">{left}</b> 塊，海水就漲
            </>
          ) : (
            '海水漲滿了'
          )}
        </span>
      )}
      {lv.gate && (
        <span className="chip">
          <CardIcon k="gate" />
          {g.gateOpen ? '石門打開了' : '壓住壓板，石門才會開'}
        </span>
      )}
    </div>
  );
}

function Bubble() {
  const bubble = useGame((s) => s.ui.bubble);
  return (
    <div id="bubble" className={bubble ? 'bubble' : 'bubble hide'} aria-live="polite">
      {bubble?.text}
    </div>
  );
}

export function Play() {
  useDragController();
  const run = useGame((s) => s.progress.run);
  const tokens = useGame((s) => s.progress.tokens);
  const audible = useGame((s) => s.progress.sound || s.progress.music);
  const busy = useGame((s) => s.ui.busy);
  if (!run) return <section id="play" className="screen" />;
  return (
    <section id="play" className="screen">
      <header className="bar">
        <button type="button" className="iconBtn" id="toHome" aria-label="地圖" onClick={() => !busy && goHome()}>
          <Icon name="map" />
          <span>地圖</span>
        </button>
        <div className="title">
          <span id="zoneName">{ZONES[run.zi].name}</span>
          <span className="dots" role="img" aria-label={`第 ${run.si + 1} / ${STAGES} 站`}>
            {Array.from({ length: STAGES }, (_, i) => (
              <span key={i} className={['dot', i < run.si && 'done', i === run.si && 'now', i === STAGES - 1 && 'boss'].filter(Boolean).join(' ')} />
            ))}
          </span>
        </div>
        <span className="coin" id="coinPlay">
          <CoinIcon />
          <b className="num">{tokens}</b>
        </span>
        <button type="button" className="iconBtn" id="audioBtn" aria-label="聲音設定" onClick={openAudioSettings}>
          <Icon name={audible ? 'soundOn' : 'soundOff'} />
        </button>
      </header>
      <Chips />
      <div className="stage">
        <div className="boardWrap">
          <Board />
          <Bubble />
        </div>
        <Tray />
      </div>
    </section>
  );
}
