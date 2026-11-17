import { useEffect } from 'react';
import { Icon } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { ensureAudio } from '../audio/context';
import { sfx } from '../audio/sfx';
import { speak } from '../audio/speech';
import { VARIANT_BY_ID } from '../content/shisa';
import { SHISA_HELLO } from '../content/story';
import { STAGES, sceneUrl, ZONES } from '../content/zones';
import { enterGame } from '../game/actions';
import { useGame } from '../state/store';
import { Cta } from '../ui/Cta';
import { nextZone } from './Home';

// The title screen, once a visit: the name built from five blocks, the pair on the red tile roof of a house in front of
// the painted scene of the zone the player is heading for, and one button into the game on the house's wall.

const LOGO = ['西', '薩', '搭', '搭', '路'];
/** The block colours of the game, with a darker edge for each */
const BLOCKS: [string, string][] = [
  ['#F3A83F', '#9C6224'],
  ['#2D8FD0', '#1E5E8C'],
  ['#CD4A31', '#86281A'],
  ['#8C56AA', '#5A3470'],
  ['#3DA399', '#23705F'],
];
/** Each block a little higher or lower and tipped a little, as if just put down */
const LIFT = [26, 12, 24, 10, 22];
const TILT = [-4, 3, -2, 4, -3];
const SIZE = 68;
const GAP = 8;

function Logo() {
  const font = 'GenSen Rounded TW, PingFang TC, sans-serif';
  return (
    <svg className="titleLogo" viewBox="0 0 388 112" role="img" aria-label="西薩搭搭路">
      {LOGO.map((ch, i) => {
        const [fill, edge] = BLOCKS[i];
        const x = 10 + i * (SIZE + GAP) + SIZE / 2;
        const y = LIFT[i] + SIZE / 2;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${TILT[i]})`}>
            <g className="logoBlock" style={{ animationDelay: `${120 + i * 110}ms` }}>
              <rect x={-SIZE / 2} y={-SIZE / 2} width={SIZE} height={SIZE} rx={13} fill={fill} stroke={edge} strokeWidth={4} />
              <rect x={-SIZE / 2 + 7} y={-SIZE / 2 + 6} width={SIZE - 14} height={9} rx={4.5} fill="#fff" opacity={0.3} />
              <text
                y={16}
                textAnchor="middle"
                fontSize={44}
                fontWeight={700}
                fill="#fff"
                stroke={edge}
                strokeWidth={6}
                strokeLinejoin="round"
                paintOrder="stroke"
                fontFamily={font}
              >
                {ch}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** The top of a red tile roof, its white ridge at y 104, with the pair standing on it */
function Roof() {
  const pair = useGame((s) => s.progress.pair);
  const tiles = (y: number, from: number, to: number) => {
    let d = `M${from},${y}`;
    for (let x = from; x < to; x += 20) d += ' a10,8 0 0 0 20,0';
    return d;
  };
  return (
    <svg viewBox="0 0 400 196" aria-hidden="true">
      <path d="M-30,196 L70,108 L330,108 L430,196 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={4} strokeLinejoin="round" />
      <path d={tiles(136, 40, 360)} fill="none" stroke="#F7E2C7" strokeWidth={3} opacity={0.8} />
      <path d={tiles(168, 6, 394)} fill="none" stroke="#F7E2C7" strokeWidth={3} opacity={0.8} />
      <rect x={60} y={98} width={280} height={14} rx={7} fill="#F2EEE6" stroke="#86281A" strokeWidth={3} />
      {[
        { x: 148, v: VARIANT_BY_ID[pair[0]], open: true },
        { x: 252, v: VARIANT_BY_ID[pair[1]], open: false },
      ].map(({ x, v, open }) => (
        <g key={x} transform={`translate(${x},104) scale(1.35)`}>
          <g className="bob">
            <ShisaArt v={v} open={open} />
          </g>
        </g>
      ))}
    </svg>
  );
}

const hello = () => {
  sfx.hello();
  if (useGame.getState().progress.sound) speak(SHISA_HELLO, undefined, 'shisa');
};

export function Title() {
  const p = useGame((s) => s.progress);
  const zi = nextZone(p);
  const run = p.run && p.run.phase !== 'done' ? p.run : null;
  // Someone has played here before once the story has been seen; a brand-new player starts instead
  const started = p.seen.includes('story');
  // Where the browser lets a page play sound before any tap (an installed app on Android, mostly), the theme starts
  // right away; elsewhere it starts with the first tap
  useEffect(() => ensureAudio(), []);
  return (
    <section id="title" style={{ backgroundImage: `url(${sceneUrl(ZONES[zi].id, 'day')})` }}>
      <Logo />
      {/* The house the pair lives on: the roof with the two of them, and its wall down to the bottom of the screen */}
      <div className="titleHouse">
        <button type="button" className="titlePair" id="titlePair" aria-label="西薩" onClick={hello}>
          <Roof />
        </button>
        <div className="titleWall">
          <Cta icon={<Icon name="play" />} id="titleGo" data={{ 'data-focus': true }} onClick={enterGame}>
            {started ? '繼續' : '開始'}
          </Cta>
          {started && (
            <p className="titleWhere">
              {run ? (
                <>
                  {ZONES[zi].name} 第 <span className="num">{run.si + 1}</span> / <span className="num">{STAGES}</span> 站
                </>
              ) : (
                <>下一站：{ZONES[zi].name}</>
              )}
            </p>
          )}
        </div>
      </div>
      <span className="titleVer num">v{__APP_VERSION__}</span>
    </section>
  );
}
