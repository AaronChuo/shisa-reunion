import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Blocks, CardIcon, CoinIcon, ConchIcon, Icon, ShellIcon, Stamp, TapHand } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { ShisaArt, ShisaIcon } from '../art/Shisa';
import { currentSongName } from '../audio/music';
import { useReadAloud } from '../audio/speech';
import { PLACES, type PlaceId } from '../content/places';
import { ABOUT_SHISA, SERIES, VARIANT_BY_ID } from '../content/shisa';
import { type IntroKey, isPiece, MECHANISM_NAMES, PIECE_NAMES, RULES } from '../content/text';
import { CARDS, stageCfg, ZONES } from '../content/zones';
import { sizeOf } from '../engine';
import {
  ackIntro,
  ackPlace,
  afterWin,
  chooseCard,
  chooseRole,
  closeModal,
  finishReveal,
  go,
  goHome,
  setOffFrom,
  startRun,
  toggleMusic,
  toggleSound,
} from '../game/actions';
import { PostcardArt } from '../places/PostcardArt';
import { type Modal, useGame } from '../state/store';
import { Cta } from '../ui/Cta';

function Sheet({ children, wide, label, enter = 'pop' }: { children: ReactNode; wide?: boolean; label: string; enter?: 'pop' | 'none' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-focus]') ?? ref.current?.querySelector<HTMLElement>('button');
    el?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={ref}
      className={['sheet', wide && 'wide', enter === 'none' && 'still'].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
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
      <Story text={RULES[k]} />
      <div className="btns">
        <Cta icon={<Icon name="check" />} data={{ 'data-ok': true, 'data-focus': true }} onClick={() => ackIntro(k)}>
          知道了
        </Cta>
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
      <div className="gains">
        <span className="gain">
          <CoinIcon />
          福氣幣 <b className="num">+1</b>
        </span>
        {rw?.shell ? (
          <span className="gain">
            <ShellIcon />
            提示貝 <b className="num">+{rw.shell}</b>
          </span>
        ) : null}
        {rw?.conch ? (
          <span className="gain">
            <ConchIcon />
            換題海螺 <b className="num">+{rw.conch}</b>
          </span>
        ) : null}
      </div>
      <div className="btns">
        <Cta icon={<Icon name={m.last ? 'check' : 'next'} />} data={{ 'data-next': true, 'data-focus': true }} onClick={afterWin}>
          {m.last ? '走完了' : '下一站'}
        </Cta>
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
                    <Blocks n={Z.boss.k} />
                    <b className="num">{Z.boss.k}</b> 塊
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
                  <Blocks n={cfg.k} />
                  <b className="num">{cfg.k}</b> 塊
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
        <Cta icon={<Icon name="gacha" />} data={{ 'data-g': true, 'data-focus': true }} onClick={() => go('gacha')}>
          去扭蛋機
        </Cta>
      </div>
      <button type="button" className="iconBtn" data-h onClick={goHome}>
        <Icon name="map" />
        <span>地圖</span>
      </button>
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
        <Cta icon={<Icon name="play" />} data={{ 'data-y': true }} onClick={() => startRun(zi)}>
          去{ZONES[zi].name}
        </Cta>
      </div>
      <button type="button" className="iconBtn" data-n data-focus onClick={closeModal}>
        <Icon name="close" />
        <span>先不要</span>
      </button>
    </Sheet>
  );
}

function Reveal({ id, seriesId, color }: { id: string; seriesId: string; color: string }) {
  const [open, setOpen] = useState(false);
  const v = VARIANT_BY_ID[id];
  const series = SERIES.find((s) => s.id === seriesId) ?? SERIES[0];
  // The shell is the one that actually rolled out of the machine
  const col = color;
  const capRef = useRef<HTMLButtonElement>(null);
  const [fly, setFly] = useState<CSSProperties | null>(null);
  // The capsule flies out of the machine's tray up to the front of the screen, spinning, before it can be opened
  useLayoutEffect(() => {
    const from = document.getElementById('outCap')?.getBoundingClientRect();
    const to = capRef.current?.getBoundingClientRect();
    if (!from || !to?.width) return;
    setFly({
      '--fx': `${from.left + from.width / 2 - (to.left + to.width / 2)}px`,
      '--fy': `${from.top + from.height / 2 - (to.top + to.height / 2)}px`,
      '--fs': `${Math.max(0.12, from.width / to.width)}`,
    } as CSSProperties);
  }, []);
  return (
    <Sheet label="扭蛋" enter="none">
      <div className="eyebrow">{series.name}</div>
      <button
        type="button"
        ref={capRef}
        className={['capsuleBtn', !open && 'shut', fly && !open && 'flyIn'].filter(Boolean).join(' ')}
        style={fly ?? undefined}
        id="capsule"
        aria-label="打開扭蛋"
        data-focus
        onClick={() => setOpen(true)}
      >
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
            <Cta icon={<ShisaIcon v={v} open />} data={{ 'data-use': true }} onClick={() => finishReveal('use')}>
              換牠出場
            </Cta>
          </div>
          <button type="button" className="iconBtn" data-keep onClick={() => finishReveal('keep')}>
            <Icon name="check" />
            <span>先收著</span>
          </button>
        </div>
      ) : (
        <>
          {/* The capsule itself is the button; a finger shows where to tap */}
          <TapHand className="capsuleHand" />
          <p>點一下打開扭蛋</p>
        </>
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
      <h2>{v.name}</h2>
      <Story text={v.story} />
      {/* The two jobs as pictures: the open mouth sets out walking, the closed mouth waits at home */}
      <div className="roles">
        {([0, 1] as const).map((role) => {
          const on = pair[role] === id;
          return (
            <button
              key={role}
              type="button"
              className={on ? 'roleCard on' : 'roleCard'}
              data-role={role}
              data-focus={role === 0 ? true : undefined}
              aria-pressed={on}
              onClick={() => chooseRole(id, role)}
            >
              <ShisaIcon v={v} open={role === 0} />
              <span className="rn">{role === 0 ? '出發' : '等待'}</span>
              <small>{role === 0 ? '張嘴，去找朋友' : '閉嘴，等朋友來'}</small>
              {on && (
                <span className="roleOn">
                  <Icon name="check" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button type="button" className="iconBtn" data-cancel onClick={closeModal}>
        <Icon name="close" />
        <span>關起來</span>
      </button>
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
        <Cta icon={<Icon name="check" />} data={{ 'data-focus': true }} onClick={closeModal}>
          知道了
        </Cta>
      </div>
    </Sheet>
  );
}

/** A place's postcard: its picture, a few things to spot, and its story to read aloud */
function Postcard({ id, start }: { id: PlaceId; start: number | null }) {
  const P = PLACES[id];
  const open = useGame((s) => s.progress.open);
  const zi = ZONES.findIndex((Z) => Z.id === id);
  const Z = ZONES[zi];
  const locked = !!Z && !open.includes(Z.id);
  return (
    <Sheet label={`${P.name}明信片`} wide>
      <div className="postcard" style={{ ['--zc' as string]: Z?.color ?? '#2D8FD0' }}>
        <svg className="postcardArt" viewBox="0 0 400 240" role="img" aria-label={P.sights.join('、')}>
          <PostcardArt id={id} />
        </svg>
        <Stamp label={P.name} mark={Z ? '★'.repeat(Z.stars) : '琉'} className="postcardStamp" />
      </div>
      <h2>{P.name}</h2>
      <div className="sights">
        {P.sights.map((t) => (
          <span key={t} className="mini">
            {t}
          </span>
        ))}
      </div>
      <Story text={P.story} />
      {locked && <p className="small">先走完{ZONES[zi - 1]?.name}，這裡才會打開</p>}
      <div className="btns">
        {start !== null && !locked ? (
          <Cta icon={<Icon name="play" />} data={{ 'data-go-place': true, 'data-focus': true }} onClick={() => setOffFrom(start)}>
            出發去{P.name}
          </Cta>
        ) : (
          <Cta icon={<Icon name="check" />} data={{ 'data-ok': true, 'data-focus': true }} onClick={ackPlace}>
            知道了
          </Cta>
        )}
      </div>
      {start !== null && !locked && (
        <button type="button" className="iconBtn" data-cancel onClick={closeModal}>
          <Icon name="close" />
          <span>先不要</span>
        </button>
      )}
    </Sheet>
  );
}

function Switch({ id, on, icon, label, detail, onToggle }: { id: string; on: boolean; icon: ReactNode; label: string; detail: string; onToggle: () => void }) {
  return (
    <button type="button" className={on ? 'switch on' : 'switch'} id={id} role="switch" aria-checked={on} onClick={onToggle}>
      <span className="switchIcon">{icon}</span>
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
        <Switch id="sfxSwitch" on={sound} icon={<Icon name={sound ? 'soundOn' : 'soundOff'} />} label="音效" detail="三線、太鼓、三板" onToggle={toggleSound} />
        <Switch
          id="musicSwitch"
          on={music}
          icon={<Icon name="music" />}
          label="背景音樂"
          detail={song ? `現在播放：${song}` : '三線彈的沖繩民謠'}
          onToggle={toggleMusic}
        />
      </div>
      <p className="small">iPhone、iPad 開著靜音模式時，網頁不會發出聲音。</p>
      <div className="btns">
        <Cta icon={<Icon name="check" />} data={{ 'data-focus': true }} onClick={closeModal}>
          好了
        </Cta>
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
      body = <Reveal key={m.id} id={m.id} seriesId={m.series} color={m.color} />;
      break;
    case 'role':
      body = <Role id={m.id} />;
      break;
    case 'about':
      body = <About />;
      break;
    case 'place':
      body = <Postcard id={m.id} start={m.start} />;
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
