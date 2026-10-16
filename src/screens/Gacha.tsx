import { CoinIcon, Icon } from '../art/Icons';
import { SERIES, VARIANTS } from '../content/shisa';
import { Machine } from '../gacha/Machine';
import { autoTurn, go, goPlay, insertCoin, openCapsule, setSeries } from '../game/actions';
import { useGame } from '../state/store';
import { Cta } from '../ui/Cta';

/**
 * The main button follows the machine: put a coin in, turn the crank, open the capsule; or go and earn coins.
 * The machine shows its own finger for each step, so the button doesn't add another.
 */
function GachaStep({ left }: { left: number }) {
  const tokens = useGame((s) => s.progress.tokens);
  const phase = useGame((s) => s.ui.pull);
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
  if (tokens < 1)
    return (
      <>
        <Cta icon={<Icon name="play" />} id="playBtn" onClick={goPlay}>
          去玩，拿福氣幣
        </Cta>
        <p id="tokenLine">過一站就能拿到 1 枚福氣幣</p>
      </>
    );
  return (
    <>
      <Cta icon={<CoinIcon />} id="coinBtn" nudge={false} onClick={insertCoin}>
        投 1 枚福氣幣
      </Cta>
      <p id="tokenLine">
        把福氣幣拖進投幣口，你有 <b className="num">{tokens}</b> 枚
      </p>
    </>
  );
}

export function Gacha() {
  const tokens = useGame((s) => s.progress.tokens);
  const owned = useGame((s) => s.progress.owned);
  const gseries = useGame((s) => s.ui.gseries);
  const phase = useGame((s) => s.ui.pull);
  const series = SERIES.find((x) => x.id === gseries) ?? SERIES[0];
  const all = VARIANTS.filter((v) => v.series === series.id);
  const left = all.filter((v) => !owned.includes(v.id)).length;
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
        <div id="machineBox">
          <Machine series={series} />
        </div>
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
          <GachaStep left={left} />
          <button type="button" className="iconBtn" data-go="dex" onClick={() => (phase === 'idle' || phase === 'ready') && go('dex')}>
            <Icon name="book" />
            <span>看圖鑑</span>
          </button>
        </div>
      </div>
    </section>
  );
}
