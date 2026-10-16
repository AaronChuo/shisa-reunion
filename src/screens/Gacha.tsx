import { CoinArt, CoinIcon, Icon } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { SERIES, type Series, VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { go, goPlay, pull, setSeries } from '../game/actions';
import { useGame } from '../state/store';
import { Cta } from '../ui/Cta';

const CAPSULE_SPOTS: [number, number][] = [
  [100, 190],
  [138, 200],
  [176, 192],
  [212, 196],
  [118, 160],
  [158, 166],
  [196, 160],
  [82, 160],
  [138, 132],
  [178, 130],
  [222, 164],
  [104, 128],
  [210, 128],
  [160, 100],
];

const capColor = (id: string) => {
  const v = VARIANT_BY_ID[id];
  return Array.isArray(v.mane) ? v.mane[0] : v.body;
};

function Machine({ series, phase, pulled }: { series: Series; phase: string; pulled: string | null }) {
  const vs = VARIANTS.filter((v) => v.series === series.id);
  return (
    <svg className="machine" viewBox="0 -12 310 452" role="img" aria-label={`${series.name}扭蛋機`}>
      <path d="M40,74 L74,30 L236,30 L270,74 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={4} strokeLinejoin="round" />
      <path d={`M58,62${' a8,7 0 0 0 16,0'.repeat(12)}`} fill="none" stroke="#F7E2C7" strokeWidth={3} />
      <g transform="translate(155,34) scale(.42)">
        <ShisaArt v={VARIANT_BY_ID.terracotta} open />
      </g>
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#F7E2C7" stroke="#86281A" strokeWidth={3} />
      <circle cx={155} cy={165} r={100} fill="#EAF7FA" fillOpacity={0.75} stroke="#7FB4C0" strokeWidth={6} />
      <g className={phase === 'crank' ? 'capsules jiggle' : 'capsules'}>
        {CAPSULE_SPOTS.map(([x, y], i) => (
          <g key={`${x},${y}`} transform={`translate(${x},${y})`}>
            <circle r={19} fill="#fff" stroke="#6E7F7C" strokeWidth={2} />
            <path d="M-19,0 A19,19 0 0 1 19,0 Z" fill={capColor(vs[i % vs.length].id)} stroke="#6E7F7C" strokeWidth={2} />
            <circle cx={-7} cy={-9} r={4} fill="#fff" opacity={0.7} />
          </g>
        ))}
      </g>
      <path d="M90,108 A80,80 0 0 1 150,80" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
      <rect x={48} y={258} width={214} height={168} rx={24} fill={series.color} stroke="#173944" strokeWidth={4} />
      <rect x={70} y={272} width={170} height={34} rx={10} fill="#fff" opacity={0.92} />
      <text x={155} y={296} textAnchor="middle" fontSize={20} fontWeight={700} fill="#173944" fontFamily="LXGW WenKai TC, PingFang TC, sans-serif">
        {series.name}
      </text>
      <rect x={198} y={320} width={34} height={44} rx={8} fill="#F7E2C7" stroke="#173944" strokeWidth={3} />
      <rect x={211} y={328} width={8} height={28} rx={4} fill="#173944" />
      {phase === 'coin' && (
        <g className="coinIn">
          <g transform="translate(200,312) scale(.75)">
            <CoinArt />
          </g>
        </g>
      )}
      <g className={phase === 'crank' ? 'crank turn' : 'crank'}>
        <circle cx={112} cy={346} r={30} fill="#fff" stroke="#173944" strokeWidth={4} />
        <rect x={104} y={318} width={16} height={56} rx={8} fill="#E8B83A" stroke="#173944" strokeWidth={3} />
        <circle cx={112} cy={346} r={7} fill="#173944" />
      </g>
      <rect x={168} y={378} width={76} height={40} rx={12} fill="#173944" opacity={0.85} />
      {phase === 'drop' && pulled && (
        <g className="outCap">
          <circle cx={206} cy={396} r={17} fill="#fff" stroke="#6E7F7C" strokeWidth={2} />
          <path d="M189,396 A17,17 0 0 1 223,396 Z" fill={capColor(pulled)} stroke="#6E7F7C" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
}

export function Gacha() {
  const tokens = useGame((s) => s.progress.tokens);
  const owned = useGame((s) => s.progress.owned);
  const gseries = useGame((s) => s.ui.gseries);
  const phase = useGame((s) => s.ui.pull);
  const pulled = useGame((s) => s.ui.pulled);
  const series = SERIES.find((x) => x.id === gseries) ?? SERIES[0];
  const all = VARIANTS.filter((v) => v.series === series.id);
  const left = all.filter((v) => !owned.includes(v.id)).length;
  const canPull = tokens > 0 && left > 0 && phase === 'idle';
  return (
    <section id="gacha" className="screen">
      <header className="bar">
        <button type="button" className="iconBtn" data-go="home" aria-label="地圖" onClick={() => phase === 'idle' && go('home')}>
          <Icon name="map" />
          <span>地圖</span>
        </button>
        <div className="title">扭蛋機</div>
        <span className="coin">
          <CoinIcon />
          <b className="num">{tokens}</b>
        </span>
      </header>
      <fieldset className="series" aria-label="選扭蛋機">
        {SERIES.map((x) => {
          const n = VARIANTS.filter((v) => v.series === x.id && owned.includes(v.id)).length;
          const total = VARIANTS.filter((v) => v.series === x.id).length;
          return (
            <button
              key={x.id}
              type="button"
              className={x.id === series.id ? 'sBtn on' : 'sBtn'}
              style={{ ['--sc' as string]: x.color }}
              data-series={x.id}
              aria-pressed={x.id === series.id}
              onClick={() => setSeries(x.id)}
            >
              <i />
              <span>
                {x.name.replace('系列', '')}
                <span className="sfx">系列</span>
              </span>{' '}
              <small>
                {n}/{total}
              </small>
            </button>
          );
        })}
      </fieldset>
      <div className="machineWrap">
        {/* Tapping the machine (its crank, its coin slot) pulls too, the way a child would try it */}
        <button type="button" id="machineBox" aria-label="轉扭蛋" disabled={!canPull} onClick={pull}>
          <Machine series={series} phase={phase} pulled={pulled} />
        </button>
        <div className="gPanel">
          {left ? (
            <p>
              這台還有 <b className="num">{left}</b> 隻沒抽到，每次一定會抽到新的。
            </p>
          ) : (
            <p>
              <b>這台的 {all.length} 隻都收集到了！</b>
            </p>
          )}
          {tokens > 0 || !left ? (
            <Cta icon={<CoinIcon />} id="pullBtn" disabled={!canPull} onClick={pull}>
              投 1 枚福氣幣
            </Cta>
          ) : (
            // Out of coins: the main button now leads back to playing, where coins come from
            <Cta icon={<Icon name="play" />} id="playBtn" onClick={goPlay}>
              去玩，拿福氣幣
            </Cta>
          )}
          <p id="tokenLine">
            {tokens < 1 ? (
              '過一站就能拿到 1 枚福氣幣'
            ) : (
              <>
                你有 <b className="num">{tokens}</b> 枚福氣幣
              </>
            )}
          </p>
          <button type="button" className="iconBtn" data-go="dex" onClick={() => phase === 'idle' && go('dex')}>
            <Icon name="book" />
            <span>看圖鑑</span>
          </button>
        </div>
      </div>
    </section>
  );
}
