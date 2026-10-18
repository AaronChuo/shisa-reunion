import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Blocks, CardIcon, CoinIcon, Icon, Stamp, TapHand } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { ShisaArt, ShisaIcon } from '../art/Shisa';
import { RoadScene } from '../art/Sights';
import { currentSongName } from '../audio/music';
import { useReadAloud } from '../audio/speech';
import { PHOTOS } from '../content/credits';
import { PLACES, type PlaceId } from '../content/places';
import { ABOUT_SHISA, SERIES, VARIANT_BY_ID } from '../content/shisa';
import { type IntroKey, isPiece, MECHANISM_NAMES, PIECE_NAMES, RULES, stopLine } from '../content/text';
import { isBranch, roadOffer, STAGES, stageCfg, ZONES, zoneStars } from '../content/zones';
import { sizeOf } from '../engine';
import {
  ackIntro,
  ackPlace,
  afterWin,
  chooseRole,
  closeModal,
  finishReveal,
  go,
  goHome,
  goNextStop,
  setOffFrom,
  startRun,
  toggleMusic,
  toggleSound,
} from '../game/actions';
import { PhotoCreditLine, PostcardPicture } from '../places/PostcardPicture';
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
      </div>
      <div className="btns">
        <Cta icon={<Icon name={m.last ? 'check' : 'next'} />} data={{ 'data-next': true, 'data-focus': true }} onClick={afterWin}>
          {m.last ? '走完了' : '下一站'}
        </Cta>
      </div>
    </Sheet>
  );
}

const TIME_WORD = { day: '白天', dusk: '黃昏', night: '夜晚' } as const;

/**
 * Between stops: what the next stop has. Most stops show one card to tap; at a branch the child picks one of two
 * roads, which changes only the scenery.
 */
function NextStop() {
  const run = useGame((s) => s.progress.run);
  if (run?.phase !== 'choose') return null;
  const Z = ZONES[run.zi];
  const boss = run.si === STAGES - 1;
  const els = run.plan[run.si] ?? [];
  const k = stageCfg(run.zi, run.si, els).k;
  const blocks = (
    <span className="mini">
      <Blocks n={k} />
      <b className="num">{k}</b> 塊
    </span>
  );
  if (isBranch(run.zi, run.si)) {
    const offer = roadOffer(run.zi, run.si, run.seed);
    return (
      <Sheet wide label="選一條路">
        <div className="eyebrow">
          {Z.name} · 第 {run.si + 1} 站
        </div>
        <h2>要走哪條路？</h2>
        <p className="roadLine">
          {stopLine(els)} · {blocks}
        </p>
        <div className="paths">
          {offer.map((i, n) => {
            const road = Z.roads[i];
            return (
              <button
                key={i}
                type="button"
                className="pathCard roadCard"
                data-card="road"
                data-road={i}
                data-time={road.time}
                {...(n === 0 ? { 'data-focus': true } : {})}
                onClick={() => goNextStop(i)}
              >
                <RoadScene time={road.time} sight={road.sight} className="roadArt" />
                <span className="pn">{road.name}</span>
                <span className="pl">{TIME_WORD[road.time]}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet label="下一站">
      <div className="eyebrow">
        {Z.name} · 第 {run.si + 1} 站
      </div>
      <h2>{boss ? '最後一站' : '下一站'}</h2>
      <div className="paths">
        <button type="button" className="pathCard" data-card={boss ? 'boss' : 'next'} data-focus onClick={() => goNextStop()}>
          {boss ? (
            <CardIcon k="boss" />
          ) : els.length ? (
            <span className="elIcons">
              {els.map((e) => (
                <CardIcon key={e} k={e} />
              ))}
            </span>
          ) : (
            <CardIcon k="build" />
          )}
          <span className="pn">{boss ? Z.boss.name : `第 ${run.si + 1} 站`}</span>
          <span className="pl">{boss ? `最後一站，${els.length ? stopLine(els) : '比較難'}` : stopLine(els)}</span>
          <span className="pc">{blocks}</span>
        </button>
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
        這趟一共拿到 <b className="num">{m.earned}</b> 枚福氣幣{m.unlocked.length ? `，${m.unlocked.map((i) => ZONES[i].name).join('、')}打開了` : ''}。
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
        <PostcardPicture id={id} className="postcardArt" />
        <Stamp label={P.name} mark={Z ? '★'.repeat(zoneStars(Z)) : '琉'} className="postcardStamp" />
      </div>
      <PhotoCreditLine id={id} />
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

/** Every postcard photo with its author, licence and source, as the licences ask */
function Credits() {
  return (
    <Sheet label="照片來源" wide>
      <h2>照片來源</h2>
      <p className="small">明信片的照片是自己拍的，或來自 Wikimedia Commons、授權可以自由使用（公眾領域或 CC BY，標示作者即可）；插畫和西薩是遊戲原創。</p>
      <ul className="creditList">
        {PHOTOS.map((c) => (
          <li key={c.place}>
            <b>{PLACES[c.place].name}</b>
            <span>
              〈{c.title}〉，
              {c.source ? (
                <a href={c.source} target="_blank" rel="noopener noreferrer">
                  {c.author}
                </a>
              ) : (
                c.author
              )}
              ，
              {c.licenseUrl ? (
                <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
                  {c.license}
                </a>
              ) : (
                c.license
              )}
              ，經裁切縮小
            </span>
          </li>
        ))}
      </ul>
      <div className="btns">
        <Cta icon={<Icon name="check" />} data={{ 'data-ok': true, 'data-focus': true }} onClick={closeModal}>
          知道了
        </Cta>
      </div>
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
      body = <NextStop />;
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
    case 'credits':
      body = <Credits />;
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
