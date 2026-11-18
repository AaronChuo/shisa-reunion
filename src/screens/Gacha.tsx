import { CoinIcon, Icon } from '../art/Icons';
import { DECOR, DECOR_PER_MACHINE, leftIn, priceOf, roundOf } from '../content/decor';
import { SERIES, VARIANTS } from '../content/shisa';
import { Machine } from '../gacha/Machine';
import { autoTurn, go, goPlay, insertCoin, openCapsule, setSeries } from '../game/actions';
import { useGame } from '../state/store';
import { Cta } from '../ui/Cta';

/**
 * The main button follows the machine: put a coin in, turn the crank, open the capsule; or go and earn coins.
 * The machine shows its own finger for each step, so the button doesn't add another.
 */
function GachaStep({ left, price }: { left: number; price: number }) {
  const tokens = useGame((s) => s.progress.tokens);
  const phase = useGame((s) => s.ui.pull);
  const coins = useGame((s) => s.ui.coins);
  if (phase === 'out')
    return (
      <>
        <Cta icon={<Icon name="gacha" />} id="openBtn" nudge={false} onClick={openCapsule}>
          打開扭蛋
        </Cta>
        <p id="tokenLine">扭蛋掉出來了！點它打開</p>
      </>
    );
  if (phase === 'ready' || phase === 'drop')
    return (
      <>
        <Cta icon={<Icon name="rot" />} id="turnBtn" nudge={false} disabled={phase === 'drop'} onClick={autoTurn}>
          轉一圈
        </Cta>
        <p id="tokenLine">用手指轉轉把手，轉一圈就會掉出一顆扭蛋</p>
      </>
    );
  if (!left) return null;
  if (tokens < price)
    return (
      <>
        <Cta icon={<Icon name="play" />} id="playBtn" onClick={goPlay}>
          去玩，拿福氣幣
        </Cta>
        <p id="tokenLine">{tokens > 0 ? `這台轉一次要 ${price} 枚，再過一站就夠了` : '過一站就能拿到 1 枚福氣幣'}</p>
      </>
    );
  return (
    <>
      <Cta icon={<CoinIcon />} id="coinBtn" nudge={false} onClick={insertCoin}>
        {coins > 0 ? '再投 1 枚' : '投 1 枚福氣幣'}
      </Cta>
      <p id="tokenLine">
        {price > 1 ? (coins > 0 ? '投幣口還有 1 個洞亮著，再投 1 枚' : '這台要投 2 枚，投幣口的 2 個洞都亮起來才轉得動') : '把福氣幣拖進投幣口'}，你有{' '}
        <b className="num">{tokens}</b> 枚
      </p>
    </>
  );
}

export function Gacha() {
  const tokens = useGame((s) => s.progress.tokens);
  const owned = useGame((s) => s.progress.owned);
  const decor = useGame((s) => s.progress.decor);
  const seen = useGame((s) => s.progress.seen);
  const age = useGame((s) => s.progress.age);
  const gseries = useGame((s) => s.ui.gseries);
  const phase = useGame((s) => s.ui.pull);
  const series = SERIES.find((x) => x.id === gseries) ?? SERIES[0];
  const all = VARIANTS.filter((v) => v.series === series.id);
  const got = { owned, decor, seen };
  const left = leftIn(series.id, got);
  const round = roundOf(series.id, got);
  return (
    <section id="gacha" className="screen">
      <header className="bar">
        <button type="button" className="iconBtn" data-go="home" aria-label="地圖" onClick={() => (phase === 'idle' || phase === 'ready') && go('home')}>
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
          // Round 2 counts the machine's decorations, beside a little house
          const r2 = roundOf(x.id, got) === 2;
          const n = r2
            ? DECOR.filter((d) => d.series === x.id && decor.includes(d.id)).length
            : VARIANTS.filter((v) => v.series === x.id && owned.includes(v.id)).length;
          const total = r2 ? DECOR_PER_MACHINE : VARIANTS.filter((v) => v.series === x.id).length;
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
              <small className={r2 ? 'r2' : undefined}>
                {r2 && <Icon name="house" />}
                {n}/{total}
              </small>
            </button>
          );
        })}
      </fieldset>
      <div className="machineWrap">
        <div id="machineBox">
          <Machine series={series} />
        </div>
        <div className="gPanel">
          {round === 1 && left ? (
            <p>
              這台還有 <b className="num">{left}</b> 隻沒抽到，每次一定會抽到新的。
            </p>
          ) : round === 1 ? (
            // The last shisa is out: the machine goes up once it has been opened and kept
            <p>
              <b>這台的 {all.length} 隻西薩都收齊了！</b>
            </p>
          ) : left ? (
            <p>
              西薩都收齊了，這台升級了！還有 <b className="num">{left}</b> 樣擺飾，轉到的可以放進西薩的家。
            </p>
          ) : (
            <p>
              <b>
                這台的 {all.length} 隻西薩和 {DECOR_PER_MACHINE} 樣擺飾都收集到了！
              </b>
            </p>
          )}
          <GachaStep left={left} price={priceOf(series.id, got, age)} />
          <button type="button" className="iconBtn" data-go="dex" onClick={() => (phase === 'idle' || phase === 'ready') && go('dex')}>
            <Icon name="book" />
            <span>看圖鑑</span>
          </button>
        </div>
      </div>
    </section>
  );
}
