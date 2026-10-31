import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Blocks, CardIcon, CoinIcon, Icon, Stamp, TapHand } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { ShisaArt, Star4 } from '../art/Shisa';
import { currentSongName } from '../audio/music';
import { useReadAloud } from '../audio/speech';
import { CARD_NEEDS, cardsEarned, PLACES, type PlaceId } from '../content/places';
import { ABOUT_SHISA, pairWith, ROLE_ASK, SERIES, VARIANT_BY_ID } from '../content/shisa';
import { type IntroKey, isPiece, MECHANISM_NAMES, PIECE_NAMES, RULES, stopLine } from '../content/text';
import { lockHint, STAGES, stageCfg, ZONES, zoneStars } from '../content/zones';
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
  showCard,
  startRun,
  toggleMusic,
  toggleSound,
} from '../game/actions';
import { PostcardPicture } from '../places/PostcardPicture';
import { type Modal, useGame } from '../state/store';
import { Cta } from '../ui/Cta';
import { AgeAsk, ParentSettings, ParentsButton, RestReminder } from './Family';
import { Sheet, Switch } from './Sheet';

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

/** A postcard just earned: its small picture and its name, now in the collection */
function NewCard({ id, n }: { id: PlaceId; n: number }) {
  return (
    <div className="newCard" data-new-card={`${id}:${n + 1}`}>
      <PostcardPicture id={id} n={n} small className="newCardArt" />
      <span>
        收到一張明信片
        <b>{PLACES[id].cards[n].name}</b>
      </span>
    </div>
  );
}

function Win({ m }: { m: Extract<Modal, { kind: 'win' }> }) {
  const pair = useGame((s) => s.progress.pair);
  const zone = useGame((s) => s.progress.run?.zone) as PlaceId | undefined;
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
      {m.card !== null && zone && <NewCard id={zone} n={m.card} />}
      <div className="btns">
        <Cta icon={<Icon name={m.last ? 'check' : 'next'} />} data={{ 'data-next': true, 'data-focus': true }} onClick={afterWin}>
          {m.last ? '走完了' : '下一站'}
        </Cta>
      </div>
    </Sheet>
  );
}

/** Between stops: one card that shows what the next stop has */
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
      {m.card !== null && <NewCard id={Z.id as PlaceId} n={m.card} />}
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
          <RoleChoice id={id} onPick={finishReveal} />
          <button type="button" className="iconBtn" data-keep onClick={() => finishReveal(null)}>
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

/** A question for children who can't read yet: the words, and a button that reads them out */
function AskAloud({ text }: { text: string }) {
  const { supported, speaking, toggle } = useReadAloud(text);
  return (
    <p className="askAloud">
      {supported && (
        <button
          type="button"
          className={speaking ? 'iconBtn readBtn on' : 'iconBtn readBtn'}
          data-ask
          aria-label={speaking ? '停下來' : '念給我聽'}
          aria-pressed={speaking}
          onClick={toggle}
        >
          <Icon name={speaking ? 'soundOff' : 'soundOn'} />
        </button>
      )}
      <span>{text}</span>
    </p>
  );
}

/** The pair as it would be: the one setting out walks over to the one waiting; the shisa being placed glows */
function PairPic({ pair, fresh }: { pair: [string, string]; fresh: 0 | 1 }) {
  return (
    <svg className="pairPic" viewBox="0 0 200 116" aria-hidden="true">
      <rect x={4} y={100} width={192} height={9} rx={4.5} fill="#EADBB8" />
      <path d="M84,72 h24" stroke="#4C6A73" strokeWidth={5} strokeDasharray="0.1 10" strokeLinecap="round" />
      <path d="M112,64 l11,8 l-11,8 Z" fill="#4C6A73" />
      {([0, 1] as const).map((role) => (
        <g key={role} transform={`translate(${role === 0 ? 46 : 154},104)`}>
          {role === fresh && (
            <>
              <ellipse cx={0} cy={-44} rx={38} ry={48} fill="#FFE9A8" />
              <Star4 x={-34} y={-86} r={7} fill="#F5B92E" className="twinkle" />
              <Star4 x={33} y={-72} r={5} fill="#F5B92E" className="twinkle" />
            </>
          )}
          <g className={role === fresh ? 'fresh' : undefined}>
            <ShisaArt v={VARIANT_BY_ID[pair[role]]} open={role === 0} />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** How long the picked card's shisa hops before the sheet closes */
const PICK_MS = 550;

/**
 * Which of the pair a shisa plays, asked with a picture of each pair as it would be rather than with words: the shisa
 * glows in its new place with its mouth open or closed, and the one it replaces is not in the picture.
 */
function RoleChoice({ id, onPick }: { id: string; onPick: (role: 0 | 1) => void }) {
  const pair = useGame((s) => s.progress.pair);
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const pick = (role: 0 | 1) => {
    if (picked !== null) return;
    setPicked(role);
    timer.current = window.setTimeout(() => onPick(role), PICK_MS);
  };
  return (
    <>
      <AskAloud text={ROLE_ASK} />
      <div className={picked === null ? 'roles' : 'roles decided'}>
        {([0, 1] as const).map((role) => {
          const on = pair[role] === id;
          return (
            <button
              key={role}
              type="button"
              className={['roleCard', on && 'on', picked === role && 'picked'].filter(Boolean).join(' ')}
              data-role={role}
              data-focus={role === 0 ? true : undefined}
              aria-pressed={on}
              onClick={() => pick(role)}
            >
              <PairPic pair={pairWith(pair, id, role)} fresh={role} />
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
    </>
  );
}

/** A collected shisa: its story, read-aloud, and which of the pair it plays */
function Role({ id }: { id: string }) {
  const v = VARIANT_BY_ID[id];
  const series = SERIES.find((x) => x.id === v.series);
  return (
    <Sheet label={v.name}>
      <div className="eyebrow">
        {series?.name}
        {v.rare ? '・稀有' : ''}
      </div>
      <h2>{v.name}</h2>
      <Story text={v.story} />
      <RoleChoice id={id} onPick={(role) => chooseRole(id, role)} />
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

/**
 * A place's postcard: one card's picture, a few things to spot and its story to read aloud. A zone's three cards sit in
 * a row below: the ones earned can be turned to, the others say what earns them.
 */
function Postcard({ id, start, n }: { id: PlaceId; start: number | null; n: number }) {
  const P = PLACES[id];
  const card = P.cards[n];
  const open = useGame((s) => s.progress.open);
  const clears = useGame((s) => s.progress.clears);
  const seen = useGame((s) => s.progress.seen);
  const got = cardsEarned(id, seen, clears);
  const zi = ZONES.findIndex((Z) => Z.id === id);
  const Z = ZONES[zi];
  const locked = !!Z && !open.includes(Z.id);
  return (
    <Sheet label={`${P.name}明信片`} wide>
      <div className="postcard" style={{ ['--zc' as string]: Z?.color ?? '#2D8FD0' }}>
        <PostcardPicture key={n} id={id} n={n} className="postcardArt" />
        <Stamp label={P.name} mark={Z ? '★'.repeat(zoneStars(Z)) : '琉'} className="postcardStamp" />
      </div>
      {P.cards.length > 1 && (
        <div className="cardStrip" style={{ ['--zc' as string]: Z?.color }}>
          {P.cards.map((c, i) =>
            i < got ? (
              <button
                key={c.name}
                type="button"
                className={i === n ? 'cardSlot on' : 'cardSlot'}
                aria-pressed={i === n}
                aria-label={c.name}
                data-card-slot={i + 1}
                onClick={() => showCard(i)}
              >
                <PostcardPicture id={id} n={i} small />
              </button>
            ) : (
              <div key={c.name} className={i === n ? 'cardSlot locked on' : 'cardSlot locked'} data-card-slot={i + 1}>
                <Icon name="lock" />
                <span>{CARD_NEEDS[i]}</span>
              </div>
            ),
          )}
        </div>
      )}
      {card.name !== P.name && <div className="eyebrow">{P.name}</div>}
      <h2>{card.name}</h2>
      <div className="sights">
        {card.sights.map((t) => (
          <span key={t} className="mini">
            {t}
          </span>
        ))}
      </div>
      <Story key={n} text={card.story} />
      {locked && <p className="small">{lockHint(zi, clears)}</p>}
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

/** Where the pictures and voices come from */
function Credits() {
  return (
    <Sheet label="素材來源" wide>
      <h2>素材來源</h2>
      <p className="small">明信片、關卡背景、積木和西薩，都是為這個遊戲畫的原創插畫。</p>
      <p className="small" id="voiceCredit">
        旁白和西薩說話的聲音，是用 Microsoft Azure AI 語音合成的；沒有錄好的句子，用裝置內建的語音念。
      </p>
      <div className="btns">
        <Cta icon={<Icon name="check" />} data={{ 'data-ok': true, 'data-focus': true }} onClick={closeModal}>
          知道了
        </Cta>
      </div>
    </Sheet>
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
      <ParentsButton />
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
      body = <Postcard id={m.id} start={m.start} n={m.n} />;
      break;
    case 'credits':
      body = <Credits />;
      break;
    case 'audio':
      body = <AudioSettings />;
      break;
    case 'age':
      body = <AgeAsk />;
      break;
    case 'parents':
      body = <ParentSettings />;
      break;
    case 'rest':
      body = <RestReminder />;
      break;
  }
  return (
    <div id="modal" className={m.kind === 'win' ? 'modal top' : 'modal'} data-kind={m.kind}>
      {body}
    </div>
  );
}
