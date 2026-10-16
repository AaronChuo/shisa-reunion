import { Icon } from '../art/Icons';
import { ShisaIcon } from '../art/Shisa';
import { SERIES, VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { askRole, go, openAbout } from '../game/actions';
import { useGame } from '../state/store';

export function Dex() {
  const owned = useGame((s) => s.progress.owned);
  const pair = useGame((s) => s.progress.pair);
  const hero = VARIANT_BY_ID[pair[0]];
  const goal = VARIANT_BY_ID[pair[1]];
  return (
    <section id="dex" className="screen scroll">
      <header className="bar">
        <button type="button" className="iconBtn" data-go="home" aria-label="地圖" onClick={() => go('home')}>
          <Icon name="map" />
          <span>地圖</span>
        </button>
        <div className="title">
          獅子圖鑑{' '}
          <span className="num">
            {owned.length}/{VARIANTS.length}
          </span>
        </div>
        <button type="button" className="iconBtn" data-go="gacha" onClick={() => go('gacha')}>
          <Icon name="gacha" />
          <span>扭蛋機</span>
        </button>
      </header>
      <div className="pairRow">
        <div className="slot">
          <ShisaIcon v={hero} open />
          <div>
            <small>出發（張嘴）</small>
            <b>{hero.name}</b>
          </div>
        </div>
        <div className="slot">
          <ShisaIcon v={goal} open={false} />
          <div>
            <small>等待（閉嘴）</small>
            <b>{goal.name}</b>
          </div>
        </div>
      </div>
      <div className="dexIntro">
        <p className="foot">點一隻收集到的獅子，聽聽牠的故事，也可以選牠出場。場上永遠只有兩隻獅子。</p>
        <button type="button" className="iconBtn" id="aboutBtn" onClick={openAbout}>
          <span>風獅爺是什麼？</span>
        </button>
      </div>
      {SERIES.map((se) => (
        <section key={se.id} className="dexSeries" style={{ ['--sc' as string]: se.color }}>
          <h3>
            <i />
            {se.name}
          </h3>
          <div className="dexGrid">
            {VARIANTS.filter((v) => v.series === se.id).map((v) =>
              owned.includes(v.id) ? (
                <button key={v.id} type="button" className="dexTile" data-pick={v.id} onClick={() => askRole(v.id)}>
                  {pair[0] === v.id && <span className="role">出發</span>}
                  {pair[1] === v.id && <span className="role b">等待</span>}
                  <ShisaIcon v={v} open={pair[1] !== v.id} />
                  <span>{v.name}</span>
                </button>
              ) : (
                <div key={v.id} className="dexTile locked">
                  <ShisaIcon v={v} open sil />
                  <span>{v.rare ? '稀有・' : ''}還沒抽到</span>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </section>
  );
}
