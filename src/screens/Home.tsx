import { CoinIcon, Icon } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { sfx } from '../audio/sfx';
import { speak } from '../audio/speech';
import { type PlaceId, placeSeen } from '../content/places';
import { VARIANT_BY_ID } from '../content/shisa';
import { SHISA_HELLO } from '../content/story';
import { lockHint, STAGES, ZONES, zoneStars, zoneTag } from '../content/zones';
import { go, openAudioSettings, openPlace, openStory, requestRun, resumeRun } from '../game/actions';
import { type Progress, useGame } from '../state/store';
import { Cta } from '../ui/Cta';
import { UpdatePrompt } from '../ui/UpdatePrompt';

const f1 = (v: number) => +v.toFixed(1);

/** Closed Catmull-Rom curve through the points */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
  }
  return `${d}Z`;
}

// Okinawa main island, roughly: Naha in the south-west, Cape Hedo at the north tip. The north is drawn shorter and the
// south taller and wider than they really are, so the many zones down south have room
const ISLAND: [number, number][] = [
  [103, 570],
  [145, 552],
  [174, 519],
  [197, 480],
  [216, 442],
  [252, 413],
  [278, 396],
  [267, 370],
  [246, 364],
  [253, 335],
  [271, 303],
  [282, 262],
  [289, 220],
  [296, 194],
  [306, 168],
  [317, 142],
  [328, 114],
  [340, 85],
  [352, 57],
  [362, 34],
  [352, 21],
  [338, 26],
  [324, 44],
  [312, 72],
  [300, 99],
  [286, 125],
  [272, 142],
  [252, 150],
  [224, 147],
  [196, 152],
  [174, 165],
  [168, 183],
  [183, 196],
  [212, 199],
  [237, 201],
  [247, 214],
  [239, 242],
  [224, 277],
  [203, 291],
  [180, 297],
  [173, 323],
  [190, 349],
  [197, 384],
  [181, 419],
  [153, 442],
  [127, 459],
  [109, 486],
  [98, 520],
  [93, 549],
];
// Ishigaki, about 400 km south-west of Naha, and Miyako, about 300 km, in an inset in the sea at the bottom (their real
// direction); Taketomi is the dot beside Ishigaki, Irabu the islet just west of Miyako
const ISHIGAKI: [number, number][] = [
  [132, 660],
  [140, 646],
  [150, 636],
  [158, 618],
  [165, 610],
  [168, 620],
  [162, 634],
  [160, 650],
  [152, 666],
  [140, 670],
];
const MIYAKO: [number, number][] = [
  [271, 630],
  [285, 622],
  [301, 624],
  [309, 636],
  [303, 648],
  [291, 658],
  [279, 654],
  [273, 642],
];
const IRABU: [number, number][] = [
  [253, 632],
  [261, 626],
  [267, 634],
  [261, 642],
];
// Kume island, about 100 km west of the main island
const KUME: [number, number][] = [
  [58, 394],
  [70, 386],
  [84, 388],
  [92, 398],
  [86, 410],
  [72, 414],
  [60, 408],
];

type Side = 'L' | 'R' | 'B';
/** Map pin per zone (same order as ZONES) and which side its name goes on */
const PINS: [number, number, Side][] = [
  [119, 483, 'B'],
  [200, 384, 'L'],
  [190, 317, 'L'],
  [257, 239, 'L'],
  [200, 173, 'L'],
  [216, 128, 'L'],
  [324, 83, 'L'],
  [280, 384, 'R'],
  [236, 433, 'R'],
  [142, 549, 'R'],
  [176, 462, 'B'],
  [74, 400, 'B'],
  [290, 640, 'R'],
  [150, 640, 'R'],
];
const ISLAND_PATH = smooth(ISLAND);
const P = (i: number) => `${PINS[i][0]},${PINS[i][1]}`;
// Up the west coast to Yanbaru, down the east coast past the Kaichu Road to Nanjo, back to Shuri, out west to Kume,
// then down the west side and round the south tip to Miyako, and on to Ishigaki
const ROUTE = `M${P(0)} Q145,425 ${P(1)} Q179,352 ${P(2)} Q217,259 ${P(3)} Q243,194 ${P(4)} Q188,147 ${P(5)} Q272,92 ${P(6)} Q350,214 ${P(7)} Q262,419 ${P(8)} Q210,506 ${P(9)} Q171,512 ${P(10)} Q106,433 ${P(11)} C40,600 200,600 ${P(12)} Q220,680 ${P(13)}`;

/** Where "go" takes a child: the unfinished journey, else the first open zone not yet finished, else the furthest one */
export function nextZone(p: Progress): number {
  if (p.run && p.run.phase !== 'done') return p.run.zi;
  const open = ZONES.map((Z, i) => ({ Z, i })).filter(({ Z }) => p.open.includes(Z.id));
  return (open.find(({ Z }) => !(p.clears[Z.id] > 0)) ?? open[open.length - 1]).i;
}

function IslandMap({ here }: { here: number }) {
  const open = useGame((s) => s.progress.open);
  const font = 'GenSen Rounded TW, PingFang TC, sans-serif';
  return (
    <svg viewBox="40 0 340 704" role="img" aria-label="沖繩地圖">
      <rect x={40} y={0} width={340} height={704} fill="#BFE6EE" />
      {[40, 110, 180, 250, 320, 390, 460, 530].map((y) => (
        <path key={y} d={`M${50 + (y % 140)},${y} q10,-6 20,0 t20,0`} stroke="#E6F7FA" strokeWidth={3} fill="none" strokeLinecap="round" />
      ))}
      <path d={ISLAND_PATH} fill="#F3E3B8" stroke="#E2C98C" strokeWidth={10} strokeLinejoin="round" />
      <path d={ISLAND_PATH} fill="#9CCF8C" />
      {/* Kouri island and its bridge */}
      <path d="M220,132 L224,145" stroke="#8C7F6B" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={216} cy={128} rx={11} ry={7.5} fill="#9CCF8C" stroke="#E2C98C" strokeWidth={4} />
      <g>
        <rect x={48} y={598} width={324} height={98} rx={14} fill="#CBEEF3" stroke="#8FC9D3" strokeWidth={2.5} strokeDasharray="6 6" />
        <text x={58} y={687} fontSize={12} fontWeight={700} fill="#3F7480" fontFamily={font}>
          八重山・宮古（本島西南方 300–400 公里）
        </text>
        {[ISHIGAKI, MIYAKO, IRABU].map((pts) => (
          <path key={pts[0][0]} d={smooth(pts)} fill="#9CCF8C" stroke="#E2C98C" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke" />
        ))}
        <circle cx={118} cy={664} r={6} fill="#F3E3B8" stroke="#E2C98C" strokeWidth={3} />
      </g>
      <path d={smooth(KUME)} fill="#9CCF8C" stroke="#E2C98C" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke" />
      <path d={ROUTE} stroke="#C8452F" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" fill="none" opacity={0.75} />
      {/* The next stop's pin pulses; the ring sits outside the pin so the tap target itself never moves */}
      <circle className="pinRing" cx={PINS[here][0]} cy={PINS[here][1]} r={17} fill="none" stroke={ZONES[here].color} strokeWidth={4} pointerEvents="none" />
      {ZONES.map((Z, i) => {
        const [x, y, side] = PINS[i];
        const locked = !open.includes(Z.id);
        const [lx, ly, anchor] =
          side === 'L' ? ([x - 20, y + 6, 'end'] as const) : side === 'R' ? ([x + 20, y + 6, 'start'] as const) : ([x, y + 36, 'middle'] as const);
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: the zone list below offers the same journeys as real buttons
          <g key={Z.id} data-zone={i} className={i === here ? 'pin here' : 'pin'} style={{ cursor: 'pointer' }} onClick={() => openPlace(Z.id as PlaceId, i)}>
            <circle cx={x} cy={y} r={17} fill={locked ? '#B9C4C2' : Z.color} stroke="#fff" strokeWidth={4} />
            <text x={x} y={y + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill="#fff" fontFamily="Fredoka, sans-serif">
              {i + 1}
            </text>
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              fontSize={side === 'B' ? 15 : 17}
              fontWeight={700}
              fill="#173944"
              stroke="#F4FBF9"
              strokeWidth={5}
              paintOrder="stroke"
              fontFamily={font}
            >
              {Z.name}
            </text>
          </g>
        );
      })}
      <g transform="translate(346,500)">
        <circle r={20} fill="#fff" opacity={0.7} />
        <path d="M0,-15 L5,0 L0,15 L-5,0 Z" fill="#C8452F" />
        <text y={-22} textAnchor="middle" fontSize={12} fontWeight={700} fill="#173944" fontFamily="Fredoka, sans-serif">
          N
        </text>
      </g>
    </svg>
  );
}

const hello = () => {
  sfx.hello();
  if (useGame.getState().progress.sound) speak(SHISA_HELLO, undefined, 'shisa');
};

export function Home() {
  const p = useGame((s) => s.progress);
  const hero = VARIANT_BY_ID[p.pair[0]];
  const goal = VARIANT_BY_ID[p.pair[1]];
  const run = p.run && p.run.phase !== 'done' ? p.run : null;
  const here = nextZone(p);
  return (
    <section id="home" className="screen scroll">
      <UpdatePrompt />
      <header className="homeHead">
        {/* Tap the pair and they say their name */}
        <button type="button" className="pairBtn" id="pairBtn" aria-label="西薩" onClick={hello}>
          <svg className="pairArt" viewBox="-60 -100 130 104" aria-hidden="true">
            <g transform="translate(-26,0)">
              <ShisaArt v={hero} open />
            </g>
            <g transform="translate(34,0)">
              <ShisaArt v={goal} open={false} />
            </g>
          </svg>
        </button>
        <div className="mh">
          <h1>西薩搭搭路</h1>
          <p className="story">
            颱風把屋頂上的西薩吹得到處都是。幫{hero.name}搭一條路回到{goal.name}身邊，每過一站拿一枚福氣幣，拿去扭蛋機轉出更多西薩。
          </p>
        </div>
        <div className="homeTools">
          <span className="coin">
            <CoinIcon />
            <b className="num">{p.tokens}</b>
          </span>
          <button type="button" className={p.tokens > 0 ? 'iconBtn hasCoins' : 'iconBtn'} data-go="gacha" onClick={() => go('gacha')}>
            <Icon name="gacha" />
            <span>扭蛋機</span>
            {p.tokens > 0 && <span className="badge num">{p.tokens}</span>}
          </button>
          <button type="button" className="iconBtn" data-go="dex" onClick={() => go('dex')}>
            <Icon name="book" />
            <span>圖鑑</span>
          </button>
          <button type="button" className="iconBtn" id="storyBtn" onClick={openStory}>
            <Icon name="tale" />
            <span>故事</span>
          </button>
          <button type="button" className="iconBtn" id="audioBtn" aria-label="聲音設定" onClick={openAudioSettings}>
            <Icon name={p.sound || p.music ? 'soundOn' : 'soundOff'} />
          </button>
        </div>
      </header>
      <div className="homeBody">
        <div className="islandWrap">
          <IslandMap here={here} />
          {/* Okinawa's own postcard; the icon wiggles until it has been read */}
          <button
            type="button"
            className={p.seen.includes(placeSeen('okinawa')) ? 'iconBtn mapOkinawa' : 'iconBtn mapOkinawa hasCoins'}
            id="okinawaBtn"
            onClick={() => openPlace('okinawa', null)}
          >
            <Icon name="postcard" />
            <span>沖繩</span>
          </button>
        </div>
        <div className="zones">
          {/* The one big button: carry on, or set out for the next zone to play */}
          <div className="goCard" style={{ ['--zc' as string]: ZONES[here].color }}>
            <div className="t">
              {run ? '旅程還沒走完' : '下一站'}：{ZONES[here].name}
              <small>
                {run ? (
                  <>
                    第 <span className="num">{run.si + 1}</span> / <span className="num">{STAGES}</span> 站，這趟拿到 <span className="num">{run.earned}</span>{' '}
                    枚福氣幣
                  </>
                ) : (
                  ZONES[here].line
                )}
              </small>
            </div>
            <Cta
              icon={<Icon name="play" />}
              id="goBtn"
              data={run ? { 'data-resume': true } : { 'data-start': true }}
              onClick={() => (run ? resumeRun() : requestRun(here))}
            >
              {run ? '繼續' : '出發'}
            </Cta>
          </div>
          {ZONES.map((Z, i) => {
            const locked = !p.open.includes(Z.id);
            const n = p.clears[Z.id] ?? 0;
            const status = locked ? lockHint(i, p.clears) : n ? `走完 ${n} 次` : '還沒走過';
            return (
              <div key={Z.id} className={locked ? 'zone locked' : i === here ? 'zone here' : 'zone'} style={{ ['--zc' as string]: Z.color }}>
                <span className="stripe" />
                <div>
                  <div className="zt">
                    <span className="zn">{Z.name}</span>
                    <span className="tag">{zoneTag(Z)}</span>
                    <span className="stars" role="img" aria-label={`難度 ${zoneStars(Z)}`}>
                      {'★'.repeat(zoneStars(Z))}
                    </span>
                  </div>
                  <div className="zl">
                    <span className="zline">{Z.line} · </span>
                    <span className="zstat">{status}</span>
                  </div>
                </div>
                <button type="button" className="iconBtn" data-zone={i} disabled={locked} onClick={() => requestRun(i)}>
                  <Icon name={locked ? 'lock' : 'play'} />
                  <span>{locked ? '未開放' : '出發'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <p className="foot">
        v{__APP_VERSION__} · 每一站的關卡都是當場隨機產生，再由求解器確認解得開、給的積木一塊都不能少。進度存在這台裝置上，加到主畫面後沒有網路也能玩。
      </p>
    </section>
  );
}
