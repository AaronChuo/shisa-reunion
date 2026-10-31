import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { CoinArt, Icon, TapHand } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { Sun } from '../art/Scene';
import { ShisaArt } from '../art/Shisa';
import { sfx } from '../audio/sfx';
import { speak, stopSpeaking } from '../audio/speech';
import { VARIANT_BY_ID } from '../content/shisa';
import { SHISA_HELLO, STORY, STORY_TITLE } from '../content/story';
import { closeStory, toggleSound } from '../game/actions';
import { nextZone } from '../screens/Home';
import { getState, useGame } from '../state/store';
import { Cta } from '../ui/Cta';

// Scenes are drawn in a 400 × 300 box; the ground line is at y = 262.
const GROUND = 262;

/** Speech that follows the sound switch: a muted game stays quiet */
const say = (text: string, as: 'narrator' | 'shisa' = 'narrator', done?: () => void) => {
  if (getState().progress.sound) speak(text, done, as);
  else done?.();
};

function Sky({ storm }: { storm?: boolean }) {
  return (
    <>
      {/* Sky and ground reach past the picture's edges, so wide or tall screens show no bare strips */}
      <rect x={-600} y={-400} width={1600} height={800} fill={storm ? '#8FA4B3' : '#BFE6EE'} />
      {!storm && <Sun cx={346} cy={50} r={22} color="#FFD45E" />}
      {[
        [70, 56, 1],
        [210, 36, 0.8],
      ].map(([x, y, k]) => (
        <g key={x} transform={`translate(${x},${y}) scale(${k})`} className={storm ? 'storyCloud dark' : 'storyCloud'}>
          <ellipse cx={0} cy={0} rx={34} ry={16} fill={storm ? '#5E6E7A' : '#fff'} />
          <ellipse cx={-18} cy={4} rx={22} ry={12} fill={storm ? '#5E6E7A' : '#fff'} />
          <ellipse cx={20} cy={5} rx={24} ry={12} fill={storm ? '#5E6E7A' : '#fff'} />
        </g>
      ))}
      <rect x={-600} y={GROUND} width={1600} height={600} fill="#9CCF8C" />
      <rect x={-600} y={GROUND} width={1600} height={6} fill="#7FB86E" />
    </>
  );
}

/** A little Okinawan house with a red tile roof; its ridge runs from x 140 to 260 at y 118 */
function House() {
  return (
    <>
      <rect x={120} y={178} width={160} height={84} fill="#F4EADA" stroke="#8C7F6B" strokeWidth={3} />
      <rect x={185} y={208} width={30} height={54} rx={4} fill="#8A5A2B" />
      <rect x={136} y={200} width={30} height={24} rx={3} fill="#BFE6EE" stroke="#8C7F6B" strokeWidth={2} />
      <rect x={234} y={200} width={30} height={24} rx={3} fill="#BFE6EE" stroke="#8C7F6B" strokeWidth={2} />
      <path d="M96,180 L140,118 L260,118 L304,180 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={3.5} strokeLinejoin="round" />
      <path
        d="M122,152 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0 a8,7 0 0 0 16,0"
        fill="none"
        stroke="#F7E2C7"
        strokeWidth={2.5}
      />
      <rect x={136} y={114} width={128} height={8} rx={4} fill="#F2EEE6" stroke="#86281A" strokeWidth={2} />
    </>
  );
}

function Bubble({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 15 + 20;
  return (
    <g className="storyBubble" transform={`translate(${x},${y})`}>
      <rect x={-w / 2} y={-30} width={w} height={28} rx={14} fill="#fff" stroke="#173944" strokeWidth={2} />
      <path d="M-6,-3 L0,6 L6,-3 Z" fill="#fff" stroke="#173944" strokeWidth={2} strokeLinejoin="round" />
      <path d="M-5,-3.5 H5" stroke="#fff" strokeWidth={3} />
      <text y={-11} textAnchor="middle" fontSize={15} fontWeight={700} fill="#173944" fontFamily="GenSen Rounded TW, PingFang TC, sans-serif">
        {text}
      </text>
    </g>
  );
}

const hero = () => VARIANT_BY_ID[getState().progress.pair[0]];
const goal = () => VARIANT_BY_ID[getState().progress.pair[1]];

/** Page 1: two shisa on the roof; tap one and it says its name */
function Meet({ onDone }: { onDone: () => void }) {
  const [hi, setHi] = useState<number | null>(null);
  const [named, setNamed] = useState(false);
  const told = useRef(false);
  const tap = (i: number) => {
    setHi(i);
    sfx.hello();
    // After the shisa says its name, the narrator tells us what they're called (once)
    const tell = () => {
      if (told.current) return;
      told.current = true;
      setNamed(true);
      say(STORY[0].after ?? '');
      onDone();
    };
    say(SHISA_HELLO, 'shisa', tell);
    // Some devices never report the end of speech; the name shows up anyway
    window.setTimeout(tell, 1600);
  };
  const spots = [
    { x: 172, v: hero(), open: true },
    { x: 228, v: goal(), open: false },
  ];
  return (
    <>
      <Sky />
      <House />
      {spots.map(({ x, v, open }, i) => (
        // biome-ignore lint/a11y/useSemanticElements: an SVG group can't be a <button>; it is keyboard-operable
        <g
          key={x}
          role="button"
          tabIndex={0}
          aria-label="點西薩"
          className="storyShisa"
          data-shisa={i}
          transform={`translate(${x},118)`}
          onClick={() => tap(i)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && tap(i)}
        >
          <g key={hi === i ? 'hop' : 'still'} className={hi === i ? 'hop' : 'bob'}>
            <ShisaArt v={v} open={open} />
          </g>
          <rect x={-28} y={-82} width={56} height={84} fill="transparent" />
        </g>
      ))}
      {hi !== null && <Bubble x={spots[hi].x} y={30} text={SHISA_HELLO} />}
      {named && (
        <g className="nameTag">
          <rect x={150} y={232} width={100} height={30} rx={15} fill="#E2703A" />
          <text x={200} y={254} textAnchor="middle" fontSize={20} fontWeight={700} fill="#fff" fontFamily="GenSen Rounded TW, PingFang TC, sans-serif">
            西薩
          </text>
        </g>
      )}
      {hi === null && <TapHand className="storyHand" x={168} y={70} size={46} />}
    </>
  );
}

/** Page 2: the open mouth takes luck in, the closed mouth keeps it */
function Pair() {
  return (
    <>
      <Sky />
      <g transform="translate(120,250) scale(1.5)">
        <ShisaArt v={hero()} open />
      </g>
      <g transform="translate(280,250) scale(1.5)">
        <ShisaArt v={goal()} open={false} />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="luckIn" style={{ animationDelay: `${i * 0.6}s` }}>
          <g transform="translate(-12,-12) scale(.6)">
            <CoinArt />
          </g>
        </g>
      ))}
      <g className="luckKeep" transform="translate(280,196)">
        <g transform="translate(-14,-14) scale(.7)">
          <CoinArt />
        </g>
      </g>
      {[
        [120, '接福氣'],
        [280, '守福氣'],
      ].map(([x, t]) => (
        <text key={x} x={x} y={284} textAnchor="middle" fontSize={16} fontWeight={700} fill="#173944" fontFamily="GenSen Rounded TW, PingFang TC, sans-serif">
          {t}
        </text>
      ))}
    </>
  );
}

/** Page 3: a swipe (or a tap) blows up a typhoon and the two are blown apart */
function Storm({ blown, onBlow }: { blown: boolean; onBlow: () => void }) {
  return (
    <>
      <Sky storm />
      <House />
      {blown && (
        <g className="wind">
          {[70, 110, 150, 190].map((y, i) => (
            <path
              key={y}
              d={`M-40,${y} q40,-14 80,0 t80,0 t80,0`}
              stroke="#fff"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </g>
      )}
      <g transform="translate(172,118)">
        <g className={blown ? 'blownLeft' : undefined}>
          <ShisaArt v={hero()} open />
        </g>
      </g>
      <g transform="translate(228,118)">
        <g className={blown ? 'blownRight' : undefined}>
          <ShisaArt v={goal()} open={false} />
        </g>
      </g>
      {!blown && (
        <>
          <g className="swipeDemo">
            <TapHand className="storyHand" x={0} y={0} size={46} />
          </g>
          {/* The whole scene is the target */}
          {/* biome-ignore lint/a11y/useSemanticElements: an SVG rect can't be a <button>; it is keyboard-operable */}
          <rect
            x={0}
            y={0}
            width={400}
            height={300}
            fill="transparent"
            role="button"
            tabIndex={0}
            aria-label="吹起颱風"
            onClick={onBlow}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBlow()}
          />
        </>
      )}
    </>
  );
}

/** When the walk over reaches the friend and the hearts come in (`.walkOver` and `.hearts` in app.css) */
const MEET_MS = 3100;

/** Page 4: a stair drops into place and the setting-out shisa walks up it to its friend; the two smile as they meet */
function Build() {
  const [met, setMet] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMet(true), MEET_MS);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <>
      <Sky />
      <g transform={`translate(260,${GROUND - 60}) scale(.6)`}>
        <PieceArt t="cube" o={0} />
      </g>
      <g className="dropIn">
        <g transform={`translate(140,${GROUND - 60}) scale(.6)`}>
          <PieceArt t="stair" o={0} />
        </g>
      </g>
      <g transform={`translate(290,${GROUND - 60})`}>
        <g className="bob">
          <ShisaArt v={goal()} open={false} smile={met} />
        </g>
      </g>
      {/* Walks along the ground, up the steps, across the top, to its friend */}
      <g className="walkOver">
        <ShisaArt v={hero()} open smile={met} />
      </g>
      <g className="hearts">
        {[-20, 0, 20].map((dx, i) => (
          <path
            key={dx}
            d={`M${262 + dx},${104 - (i % 2) * 12} c-7,-8 -16,0 0,10 c16,-10 7,-18 0,-10 Z`}
            fill="#E2513C"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </g>
    </>
  );
}

/** Page 5: together again; off we go */
function Go() {
  return (
    <>
      <Sky />
      <House />
      <g transform="translate(184,118)">
        <g className="cheerStory">
          <ShisaArt v={hero()} open smile />
        </g>
      </g>
      <g transform="translate(216,118)">
        <g className="cheerStory" style={{ animationDelay: '0.2s' }}>
          <ShisaArt v={goal()} open={false} smile />
        </g>
      </g>
    </>
  );
}

/** The opening picture book: five short pages, read aloud, each with something to tap or watch */
export function Opening() {
  const [page, setPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [blown, setBlown] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const P = STORY[page];
  const last = page === STORY.length - 1;

  // Pages without an action can be turned straight away; "meet" and "storm" wait for the child
  useEffect(() => {
    setReady(P.id !== 'meet' && P.id !== 'storm');
  }, [P.id]);
  useEffect(() => () => stopSpeaking(), []);

  const turn = () => {
    const n = page + 1;
    setPage(n);
    setBlown(false);
    sfx.hello();
    say(STORY[n].say);
  };
  const blow = () => {
    if (blown) return;
    setBlown(true);
    sfx.slide();
    sfx.rotate();
    say(STORY[2].after ?? '');
    window.setTimeout(() => setReady(true), 900);
  };
  const finish = (go: boolean) => {
    stopSpeaking();
    closeStory(go, nextZone(getState().progress));
  };
  // A swipe across the storm page blows the wind; so does a tap
  const down = (e: ReactPointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const move = (e: ReactPointerEvent) => {
    const s = swipe.current;
    if (P.id === 'storm' && s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 40) {
      swipe.current = null;
      blow();
    }
  };
  const audible = useGame((s) => s.progress.sound);

  return (
    <section id="story" className="storyBook" role="dialog" aria-modal="true" aria-label={STORY_TITLE} data-page={P.id}>
      <header className="storyHead">
        <span className="storyTitle">{STORY_TITLE}</span>
        <button type="button" className="iconBtn" id="storySound" aria-label={audible ? '關掉聲音' : '打開聲音'} onClick={toggleSound}>
          <Icon name={audible ? 'soundOn' : 'soundOff'} />
        </button>
        <button type="button" className="iconBtn" id="skipStory" onClick={() => finish(false)}>
          <Icon name="close" />
          <span>跳過</span>
        </button>
      </header>
      <svg
        className="storyScene"
        viewBox="0 0 400 300"
        role="img"
        aria-label={P.say}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => {
          swipe.current = null;
        }}
      >
        {P.id === 'meet' && <Meet onDone={() => setReady(true)} />}
        {P.id === 'pair' && <Pair />}
        {P.id === 'storm' && <Storm blown={blown} onBlow={blow} />}
        {P.id === 'build' && <Build key={page} />}
        {P.id === 'go' && <Go />}
      </svg>
      <p className="storyText" aria-live="polite">
        {P.id === 'meet' && ready ? STORY[0].after : P.id === 'storm' && blown ? STORY[2].after : P.say}
      </p>
      <div className="storyFoot">
        <div className="storyDots" role="img" aria-label={`第 ${page + 1} / ${STORY.length} 頁`}>
          {STORY.map((s, i) => (
            <span key={s.id} className={i === page ? 'on' : undefined} />
          ))}
        </div>
        {last ? (
          <Cta icon={<Icon name="play" />} id="storyGo" onClick={() => finish(true)}>
            出發
          </Cta>
        ) : (
          <Cta icon={<Icon name="next" />} id="storyNext" disabled={!ready} nudge={ready} onClick={turn}>
            下一頁
          </Cta>
        )}
      </div>
    </section>
  );
}
