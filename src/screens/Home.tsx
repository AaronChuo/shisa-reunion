import { CoinIcon, Icon, Stamp } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { VARIANT_BY_ID } from '../content/shisa';
import { STAGES, ZONES } from '../content/zones';
import { go, openAudioSettings, requestRun, resumeRun } from '../game/actions';
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

// Okinawa main island, roughly: Naha in the south-west, Cape Hedo at the north tip
const ISLAND: [number, number][] = [
  [118, 540],
  [150, 528],
  [172, 505],
  [190, 478],
  [205, 452],
  [232, 432],
  [252, 420],
  [244, 402],
  [228, 398],
  [234, 378],
  [250, 356],
  [262, 328],
  [272, 298],
  [284, 262],
  [296, 226],
  [307, 190],
  [318, 150],
  [330, 110],
  [342, 72],
  [352, 40],
  [342, 22],
  [328, 28],
  [314, 54],
  [302, 92],
  [290, 130],
  [276, 166],
  [262, 190],
  [242, 200],
  [214, 196],
  [186, 204],
  [164, 222],
  [158, 246],
  [174, 264],
  [202, 268],
  [226, 272],
  [234, 290],
  [226, 314],
  [212, 338],
  [194, 348],
  [175, 352],
  [170, 370],
  [184, 388],
  [190, 412],
  [178, 436],
  [156, 452],
  [136, 464],
  [122, 482],
  [114, 506],
  [110, 526],
];
// Yaeyama islands, far to the south-west, drawn in an inset in the open sea at the top left
const IRIOMOTE: [number, number][] = [
  [62, 86],
  [70, 72],
  [86, 66],
  [104, 68],
  [120, 76],
  [126, 92],
  [118, 108],
  [100, 116],
  [80, 114],
  [66, 104],
];
const ISHIGAKI: [number, number][] = [
  [178, 96],
  [186, 82],
  [196, 72],
  [204, 54],
  [211, 46],
  [214, 56],
  [208, 70],
  [206, 86],
  [198, 102],
  [186, 106],
];

type Side = 'L' | 'R' | 'B';
/** Map pin per zone (same order as ZONES) and which side its name goes on */
const PINS: [number, number, Side][] = [
  [134, 478, 'L'],
  [186, 384, 'L'],
  [190, 232, 'L'],
  [206, 170, 'L'],
  [160, 100, 'B'],
  [94, 90, 'B'],
  [176, 462, 'R'],
];
const ISLAND_PATH = smooth(ISLAND);
const P = (i: number) => `${PINS[i][0]},${PINS[i][1]}`;
// Up the main island to Kouri, a ferry to Yaeyama, and the long way back to Shuri for the finale
const ROUTE = `M${P(0)} Q150,430 ${P(1)} Q160,300 ${P(2)} Q178,200 ${P(3)} Q206,128 ${P(4)} Q128,124 ${P(5)} Q52,330 ${P(6)}`;

/** Where "go" takes a child: the unfinished journey, else the first open zone not yet finished, else the furthest one */
export function nextZone(p: Progress): number {
  if (p.run && p.run.phase !== 'done') return p.run.zi;
  const open = ZONES.map((Z, i) => ({ Z, i })).filter(({ Z }) => p.open.includes(Z.id));
  return (open.find(({ Z }) => !(p.clears[Z.id] > 0)) ?? open[open.length - 1]).i;
}

function IslandMap({ here }: { here: number }) {
  const open = useGame((s) => s.progress.open);
  const clears = useGame((s) => s.progress.clears);
  const font = 'GenSen Rounded TW, PingFang TC, sans-serif';
  return (
    <svg viewBox="40 0 340 560" role="img" aria-label="沖繩地圖">
      <rect x={40} y={0} width={340} height={560} fill="#BFE6EE" />
      {[40, 110, 180, 250, 320, 390, 460, 530].map((y) => (
        <path key={y} d={`M${50 + (y % 140)},${y} q10,-6 20,0 t20,0`} stroke="#E6F7FA" strokeWidth={3} fill="none" strokeLinecap="round" />
      ))}
      <path d={ISLAND_PATH} fill="#F3E3B8" stroke="#E2C98C" strokeWidth={10} strokeLinejoin="round" />
      <path d={ISLAND_PATH} fill="#9CCF8C" />
      <path d="M210,176 L214,194" stroke="#8C7F6B" strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={206} cy={170} rx={11} ry={7.5} fill="#9CCF8C" stroke="#E2C98C" strokeWidth={4} />
      <g>
        <rect x={48} y={12} width={174} height={144} rx={14} fill="#CBEEF3" stroke="#8FC9D3" strokeWidth={2.5} strokeDasharray="6 6" />
        <text x={60} y={34} fontSize={12} fontWeight={700} fill="#3F7480" fontFamily={font}>
          八重山（在很南邊）
        </text>
        {[IRIOMOTE, ISHIGAKI].map((pts) => (
          <path key={pts[0][0]} d={smooth(pts)} fill="#9CCF8C" stroke="#E2C98C" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke" />
        ))}
        <circle cx={160} cy={104} r={7} fill="#F3E3B8" stroke="#E2C98C" strokeWidth={3} />
        <text x={198} y={124} textAnchor="middle" fontSize={11} fill="#5E7F86" fontFamily={font}>
          石垣島
        </text>
      </g>
      <path d={ROUTE} stroke="#C8452F" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" fill="none" opacity={0.75} />
      {ZONES.map((Z, i) => {
        const [x, y, side] = PINS[i];
        const locked = !open.includes(Z.id);
        const [lx, ly, anchor] =
          side === 'L' ? ([x - 20, y + 6, 'end'] as const) : side === 'R' ? ([x + 20, y + 6, 'start'] as const) : ([x, y + 36, 'middle'] as const);
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: the zone list below offers the same action as real buttons
          <g
            key={Z.id}
            data-zone={i}
            className={i === here ? 'pin here' : 'pin'}
            style={{ cursor: locked ? 'default' : 'pointer' }}
            onClick={() => !locked && requestRun(i)}
          >
            {i === here && <circle className="pinRing" cx={x} cy={y} r={17} fill="none" stroke={Z.color} strokeWidth={4} />}
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
            {clears[Z.id] > 0 && <Stamp label="" mark="過" x={x + (side === 'R' ? -36 : 12)} y={y - 38} size={26} />}
          </g>
        );
      })}
      <g transform="translate(330,500)">
        <circle r={20} fill="#fff" opacity={0.7} />
        <path d="M0,-15 L5,0 L0,15 L-5,0 Z" fill="#C8452F" />
        <text y={-22} textAnchor="middle" fontSize={12} fontWeight={700} fill="#173944" fontFamily="Fredoka, sans-serif">
          N
        </text>
      </g>
    </svg>
  );
}

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
        <svg className="pairArt" viewBox="-60 -100 130 104" aria-hidden="true">
          <g transform="translate(-26,0)">
            <ShisaArt v={hero} open />
          </g>
          <g transform="translate(34,0)">
            <ShisaArt v={goal} open={false} />
          </g>
        </svg>
        <div className="mh">
          <h1>小獅搭路</h1>
          <p className="story">
            颱風把屋頂上的風獅爺吹得到處都是。幫{hero.name}搭一條路回到{goal.name}身邊，每過一站拿一枚福氣幣，拿去扭蛋機轉出更多獅子。
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
          <button type="button" className="iconBtn" id="audioBtn" aria-label="聲音設定" onClick={openAudioSettings}>
            <Icon name={p.sound || p.music ? 'soundOn' : 'soundOff'} />
          </button>
        </div>
      </header>
      <div className="homeBody">
        <div className="islandWrap">
          <IslandMap here={here} />
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
            const status = locked ? `先走完${ZONES[i - 1].name}才會打開` : n ? `走完 ${n} 次` : '還沒走過';
            return (
              <div key={Z.id} className={locked ? 'zone locked' : i === here ? 'zone here' : 'zone'} style={{ ['--zc' as string]: Z.color }}>
                <span className="stripe" />
                <div>
                  <div className="zt">
                    <span className="zn">{Z.name}</span>
                    <span className="tag">{Z.tag}</span>
                    <span className="stars" role="img" aria-label={`難度 ${Z.stars}`}>
                      {'★'.repeat(Z.stars)}
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
