import { Icon } from '../art/Icons';
import { ShisaIcon } from '../art/Shisa';
import { PLACE_ORDER, PLACES, placeSeen } from '../content/places';
import { SERIES, VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { askRole, go, openAbout, openCredits, openPlace, setDexTab } from '../game/actions';
import { PostcardPicture } from '../places/PostcardPicture';
import { useGame } from '../state/store';

export function Dex() {
  const owned = useGame((s) => s.progress.owned);
  const seen = useGame((s) => s.progress.seen);
  const clears = useGame((s) => s.progress.clears);
  const got = PLACE_ORDER.filter((id) => id === 'okinawa' || seen.includes(placeSeen(id)) || (clears[id] ?? 0) > 0);
  const pair = useGame((s) => s.progress.pair);
  const hero = VARIANT_BY_ID[pair[0]];
  const goal = VARIANT_BY_ID[pair[1]];
  const tab = useGame((s) => s.ui.dexTab);
  const tabs = [
    { id: 'shisa', label: '西薩', count: `${owned.length}/${VARIANTS.length}` },
    { id: 'cards', label: '明信片', count: `${got.length}/${PLACE_ORDER.length}` },
  ] as const;
  return (
    <section id="dex" className="screen scroll">
      <header className="bar">
        <button type="button" className="iconBtn" data-go="home" aria-label="地圖" onClick={() => go('home')}>
          <Icon name="map" />
          <span>地圖</span>
        </button>
        <div className="title">圖鑑</div>
        <button type="button" className="iconBtn" data-go="gacha" onClick={() => go('gacha')}>
          <Icon name="gacha" />
          <span>扭蛋機</span>
        </button>
      </header>
      <div className="dexTabs" role="tablist" aria-label="圖鑑">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`page-${t.id}`}
            className={tab === t.id ? 'dexTab on' : 'dexTab'}
            onClick={() => setDexTab(t.id)}
          >
            {t.label} <span className="num">{t.count}</span>
          </button>
        ))}
      </div>
      {tab === 'shisa' ? (
        <div className="dexPage" role="tabpanel" id="page-shisa" aria-labelledby="tab-shisa">
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
            <p className="foot">點一隻收集到的西薩，聽聽牠的故事，也可以選牠出場。場上永遠只有兩隻西薩。</p>
            <button type="button" className="iconBtn" id="aboutBtn" onClick={openAbout}>
              <span>西薩是什麼？</span>
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
        </div>
      ) : (
        <div className="dexPage" role="tabpanel" id="page-cards" aria-labelledby="tab-cards">
          {/* Postcards: Okinawa, then each place once it has been visited */}
          <section className="dexSeries" style={{ ['--sc' as string]: '#2D8FD0' }}>
            <h3>
              <i />
              地區明信片{' '}
              <small className="num">
                {got.length}/{PLACE_ORDER.length}
              </small>
            </h3>
            <div className="pcGrid">
              {PLACE_ORDER.map((id) =>
                got.includes(id) ? (
                  <button key={id} type="button" className="pcTile" data-place={id} onClick={() => openPlace(id, null)}>
                    <PostcardPicture id={id} />
                    <span>{PLACES[id].name}</span>
                  </button>
                ) : (
                  <div key={id} className="pcTile locked" data-place={id}>
                    <Icon name="lock" />
                    <span>還沒去過</span>
                  </div>
                ),
              )}
            </div>
            <button type="button" className="linkBtn" id="creditsBtn" onClick={openCredits}>
              素材來源
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
