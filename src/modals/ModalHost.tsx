import { type ReactNode, useEffect, useRef, useState } from 'react';
import { CardIcon, CoinIcon, ConchIcon, Icon, ShellIcon, Stamp } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { ShisaArt, ShisaIcon } from '../art/Shisa';
import { currentSongName } from '../audio/music';
import { useReadAloud } from '../audio/speech';
import { ABOUT_SHISA, SERIES, VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { type IntroKey, isPiece, MECHANISM_NAMES, PIECE_NAMES, RULES } from '../content/text';
import { CARDS, stageCfg, ZONES } from '../content/zones';
import { sizeOf } from '../engine';
import { ackIntro, afterWin, chooseCard, chooseRole, closeModal, finishReveal, go, goHome, startRun, toggleMusic, toggleSound } from '../game/actions';
import { type Modal, useGame } from '../state/store';

function Sheet({ children, wide, label }: { children: ReactNode; wide?: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-focus]') ?? ref.current?.querySelector<HTMLElement>('button');
    el?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} className={wide ? 'sheet wide' : 'sheet'} role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>
  );
}

/** A story paragraph with a "念給我聽" button that reads it aloud */
function Story({ text }: { text: string }) {
  const { supported, speaking, toggle } = useReadAloud(text);
  return (
    <div className="tale">
      <p>{text}</p>
      {supported && (
        <button type="button" className={speaking ? 'iconBtn readBtn on' : 'iconBtn readBtn'} data-read aria-pressed={speaking} onClick={toggle}>
          <Icon name={speaking ? 'soundOff' : 'soundOn'} />
          <span>{speaking ? '停下來' : '念給我聽'}</span>
        </button>
      )}
    </div>
  );
}

function IntroArt({ k }: { k: IntroKey }) {
  if (isPiece(k)) {
    const { w, h } = sizeOf(k, 0);
    return (
      <svg className="introArt" viewBox={`-10 -10 ${w * 100 + 20} ${h * 100 + 20}`} aria-hidden="true">
        <PieceArt t={k} o={0} />
      </svg>
    );
  }
  return <CardIcon k={k} className="introArt" />;
}

function Intro({ k }: { k: IntroKey }) {
  return (
    <Sheet label="新東西">
      <div className="eyebrow">{isPiece(k) ? '新積木' : '新機關'}</div>
      <IntroArt k={k} />
      <h2>{isPiece(k) ? PIECE_NAMES[k] : MECHANISM_NAMES[k]}</h2>
      <p>{RULES[k]}</p>
      <div className="btns">
        <button type="button" className="iconBtn primary big" data-ok data-focus onClick={() => ackIntro(k)}>
          知道了
        </button>
      </div>
    </Sheet>
  );
}

function Win({ m }: { m: Extract<Modal, { kind: 'win' }> }) {
  const pair = useGame((s) => s.progress.pair);
  const rw = m.reward;
  return (
    <Sheet label="過關">
      <CoinIcon className="bigCoin" />
      <h2>
        {VARIANT_BY_ID[pair[0]].name}回到{VARIANT_BY_ID[pair[1]].name}身邊了！
      </h2>
      <p>
        福氣幣 +1
        {rw?.shell ? `，還拿到提示貝 ×${rw.shell}` : ''}
        {rw?.conch ? `，還拿到換題海螺 ×${rw.conch}` : ''}
      </p>
      <div className="btns">
        <button type="button" className="iconBtn primary big" data-next data-focus onClick={afterWin}>
          <span>{m.last ? '走完這趟旅程' : '選下一條路'}</span>
          <Icon name="next" />
        </button>
      </div>
    </Sheet>
  );
}

function Branch() {
  const run = useGame((s) => s.progress.run);
  if (!run?.cards) return null;
  const Z = ZONES[run.zi];
  const isBoss = run.cards[0] === 'boss';
  return (
    <Sheet wide label="選下一條路">
      <div className="eyebrow">
        {Z.name} · 第 {run.si + 1} 站
      </div>
      <h2>{isBoss ? '最後一站' : '下一站要走哪條路？'}</h2>
      <div className="paths">
        {run.cards.map((key) => {
          if (key === 'boss') {
            return (
              <button key={key} type="button" className="pathCard" data-card="boss" data-focus onClick={() => chooseCard('boss')}>
                <CardIcon k="boss" />
                <span className="pn">{Z.boss.name}</span>
                <span className="pl">最後一站，比較難</span>
                <span className="pc">
                  <span className="mini">
                    積木 <b className="num">{Z.boss.k}</b> 塊
                  </span>
                </span>
              </button>
            );
          }
          const c = CARDS[key];
          const cfg = stageCfg(run.zi, run.si, key);
          return (
            <button key={key} type="button" className="pathCard" data-card={key} onClick={() => chooseCard(key)}>
              <CardIcon k={key} />
              <span className="pn">{c.name}</span>
              <span className="pl">{c.line}</span>
              <span className="pc">
                <span className="mini">
                  積木 <b className="num">{cfg.k}</b> 塊
                </span>
                {c.reward?.shell && (
                  <span className="mini">
                    <ShellIcon />
                    提示貝 +{c.reward.shell}
                  </span>
                )}
                {c.reward?.conch && (
                  <span className="mini">
                    <ConchIcon />
                    換題海螺 +{c.reward.conch}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function Done({ m }: { m: Extract<Modal, { kind: 'done' }> }) {
  const Z = ZONES[m.zi];
  return (
    <Sheet label="旅程完成">
      <Stamp label={Z.name} mark="過" className="doneStamp" />
      <h2>{Z.name} 走完了！</h2>
      <p>
        這趟一共拿到 <b className="num">{m.earned}</b> 枚福氣幣{m.unlocked !== null ? `，${ZONES[m.unlocked].name}打開了` : ''}。
      </p>
      <div className="btns">
        <button type="button" className="iconBtn primary big" data-g data-focus onClick={() => go('gacha')}>
          <span>去扭蛋機</span>
        </button>
        <button type="button" className="iconBtn big" data-h onClick={goHome}>
          <Icon name="map" />
          <span>地圖</span>
        </button>
      </div>
    </Sheet>
  );
}

function ConfirmRun({ zi }: { zi: number }) {
  const run = useGame((s) => s.progress.run);
  return (
    <Sheet label="換一條旅程">
      <h2>換一條旅程？</h2>
      <p>{run ? ZONES[run.zi].name : ''}的旅程會結束，已經拿到的福氣幣會留著。</p>
      <div className="btns">
        <button type="button" className="iconBtn primary big" data-y onClick={() => startRun(zi)}>
          <span>出發去{ZONES[zi].name}</span>
        </button>
        <button type="button" className="iconBtn big" data-n data-focus onClick={closeModal}>
          先不要
        </button>
      </div>
    </Sheet>
  );
}

function Reveal({ id, seriesId }: { id: string; seriesId: string }) {
  const [open, setOpen] = useState(false);
  const tokens = useGame((s) => s.progress.tokens);
  const owned = useGame((s) => s.progress.owned);
  const v = VARIANT_BY_ID[id];
  const series = SERIES.find((s) => s.id === seriesId) ?? SERIES[0];
  const col = Array.isArray(v.mane) ? v.mane[0] : v.body;
  const canAgain = tokens > 0 && VARIANTS.some((x) => x.series === series.id && !owned.includes(x.id));
  return (
    <Sheet label="扭蛋">
      <div className="eyebrow">{series.name}</div>
      <button type="button" className="capsuleBtn" id="capsule" aria-label="打開扭蛋" data-focus onClick={() => setOpen(true)}>
        <svg className={open ? 'reveal open' : 'reveal'} viewBox="-110 -130 220 220" aria-hidden="true">
          <g className="who">
            <g transform="translate(0,60) scale(1.7)">
              <ShisaArt v={v} open />
            </g>
          </g>
          <g className="capBot">
            <path d="M-80,-20 A80,80 0 0 0 80,-20 Z" fill="#fff" stroke="#6E7F7C" strokeWidth={4} />
          </g>
          <g className="capTop">
            <path d="M-80,-20 A80,80 0 0 1 80,-20 Z" fill={col} stroke="#6E7F7C" strokeWidth={4} />
            <circle cx={-30} cy={-62} r={12} fill="#fff" opacity={0.6} />
          </g>
        </svg>
      </button>
      {open ? (
        <div className="revealText">
          <span className="newTag">NEW</span>
          <h2>{v.name}</h2>
          <p>
            {v.note}
            {v.rare && <span className="rare">　稀有！</span>}
          </p>
          <Story text={v.story} />
          <div className="btns">
            <button type="button" className="iconBtn primary big" data-use onClick={() => finishReveal('use')}>
              <span>換上去玩</span>
            </button>
            {canAgain && (
              <button type="button" className="iconBtn big" data-again onClick={() => finishReveal('again')}>
                <span>再轉一次</span>
              </button>
            )}
            <button type="button" className="iconBtn big" data-keep onClick={() => finishReveal('keep')}>
              收下
            </button>
          </div>
        </div>
      ) : (
        <p>點一下打開扭蛋</p>
      )}
    </Sheet>
  );
}

/** A collected shisa: its story, read-aloud, and which of the pair it plays */
function Role({ id }: { id: string }) {
  const v = VARIANT_BY_ID[id];
  const pair = useGame((s) => s.progress.pair);
  const series = SERIES.find((x) => x.id === v.series);
  return (
    <Sheet label={v.name}>
      <div className="eyebrow">
        {series?.name}
        {v.rare ? '・稀有' : ''}
      </div>
      <ShisaIcon v={v} open={pair[1] !== id} className="roleArt" />
      <h2>{v.name}</h2>
      <Story text={v.story} />
      <div className="btns column">
        <button type="button" className="iconBtn primary big" data-role="0" data-focus disabled={pair[0] === id} onClick={() => chooseRole(id, 0)}>
          {pair[0] === id ? '正在當出發的獅子' : '當出發的獅子（張嘴）'}
        </button>
        <button type="button" className="iconBtn big teal" data-role="1" disabled={pair[1] === id} onClick={() => chooseRole(id, 1)}>
          {pair[1] === id ? '正在當等待的獅子' : '當等待的獅子（閉嘴）'}
        </button>
        <button type="button" className="iconBtn" data-cancel onClick={closeModal}>
          關起來
        </button>
      </div>
    </Sheet>
  );
}

function About() {
  return (
    <Sheet label={ABOUT_SHISA.title}>
      <svg className="aboutArt" viewBox="-100 -104 200 108" aria-hidden="true">
        <g transform="translate(-40,0)">
          <ShisaArt v={VARIANT_BY_ID.terracotta} open />
        </g>
        <g transform="translate(40,0)">
          <ShisaArt v={VARIANT_BY_ID.celadon} open={false} />
        </g>
      </svg>
      <h2>{ABOUT_SHISA.title}</h2>
      <Story text={ABOUT_SHISA.story} />
      <div className="btns">
        <button type="button" className="iconBtn primary big" data-focus onClick={closeModal}>
          知道了
        </button>
      </div>
    </Sheet>
  );
}

function Switch({ id, on, label, detail, onToggle }: { id: string; on: boolean; label: string; detail: string; onToggle: () => void }) {
  return (
    <button type="button" className={on ? 'switch on' : 'switch'} id={id} role="switch" aria-checked={on} onClick={onToggle}>
      <span className="switchText">
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <span className="knob" aria-hidden="true">
        {on ? '開' : '關'}
      </span>
    </button>
  );
}

function AudioSettings() {
  const sound = useGame((s) => s.progress.sound);
  const music = useGame((s) => s.progress.music);
  const song = currentSongName();
  return (
    <Sheet label="聲音設定">
      <h2>聲音</h2>
      <div className="switches">
        <Switch id="sfxSwitch" on={sound} label="音效" detail="三線、太鼓、三板" onToggle={toggleSound} />
        <Switch id="musicSwitch" on={music} label="背景音樂" detail={song ? `現在播放：${song}` : '三線彈的沖繩民謠'} onToggle={toggleMusic} />
      </div>
      <p className="small">iPhone、iPad 開著靜音模式時，網頁不會發出聲音。</p>
      <div className="btns">
        <button type="button" className="iconBtn primary big" data-focus onClick={closeModal}>
          好了
        </button>
      </div>
    </Sheet>
  );
}

function Loading() {
  return (
    <Sheet label="準備關卡">
      <svg className="wave" viewBox="0 0 120 40" aria-hidden="true">
        <path d="M0,22 q10,-10 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" stroke="#2EA6BE" strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>
      <h2>海浪正在送來新關卡</h2>
    </Sheet>
  );
}

export function ModalHost() {
  const m = useGame((s) => s.ui.modal);
  if (!m) return null;
  let body: ReactNode = null;
  switch (m.kind) {
    case 'loading':
      body = <Loading />;
      break;
    case 'intro':
      body = <Intro k={m.key} />;
      break;
    case 'win':
      body = <Win m={m} />;
      break;
    case 'branch':
      body = <Branch />;
      break;
    case 'done':
      body = <Done m={m} />;
      break;
    case 'confirmRun':
      body = <ConfirmRun zi={m.zi} />;
      break;
    case 'reveal':
      body = <Reveal key={m.id} id={m.id} seriesId={m.series} />;
      break;
    case 'role':
      body = <Role id={m.id} />;
      break;
    case 'about':
      body = <About />;
      break;
    case 'audio':
      body = <AudioSettings />;
      break;
  }
  return (
    <div id="modal" className={m.kind === 'win' ? 'modal top' : 'modal'} data-kind={m.kind}>
      {body}
    </div>
  );
}
