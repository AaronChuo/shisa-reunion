import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Icon } from '../art/Icons';
import { ShisaArt, ShisaIcon } from '../art/Shisa';
import { sfx } from '../audio/sfx';
import { backdrops, clampSpot, DECOR, DECOR_BY_ID, HOUSE_CAP, HOUSE_H, HOUSE_W, isDecor, ROOF_SPOTS, SKY, stickerSize } from '../content/house';
import { VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { sceneUrl } from '../content/zones';
import { go } from '../game/actions';
import { cannotPlace, moveInHouse, putAway, putInHouse, setBackdrop } from '../game/house';
import { DecorArt, DecorIcon } from '../house/DecorArt';
import { HouseArt, SkyArt } from '../house/HouseArt';
import { getState, useGame } from '../state/store';

// 西薩的家 (ADR-0037): drag things from the drawer into the house, or tap one and it hops into the yard; drag them
// around, or back into the drawer to put them away. Tapping something in the house makes it hop and say its name.

type Tab = 'decor' | 'shisa' | 'bd';

const TABS: { id: Tab; label: string }[] = [
  { id: 'decor', label: '擺飾' },
  { id: 'shisa', label: '西薩' },
  { id: 'bd', label: '背景' },
];

const HINT = '把東西拖到家裡，或點一下讓它跳進院子。拖回抽屜就收起來。';

const nameOf = (id: string): string => DECOR_BY_ID[id]?.name ?? VARIANT_BY_ID[id]?.name ?? '';
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function inside(el: Element | null, x: number, y: number): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/** A sticker's picture: a decoration in its box, or a shisa framed as in ShisaIcon */
function StickerArt({ id }: { id: string }) {
  if (isDecor(id))
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <DecorArt id={id} />
      </svg>
    );
  return <ShisaIcon v={VARIANT_BY_ID[id]} open={false} />;
}

interface Drag {
  from: 'tile' | 'stk';
  id: string;
  x0: number;
  y0: number;
  moved: boolean;
  /** A tile that can go in the house is being carried (a ghost follows the finger) */
  carry: boolean;
  /** From the finger to the sticker's feet, in house units */
  dx: number;
  dy: number;
}

export function House() {
  const house = useGame((s) => s.progress.house);
  const pair = useGame((s) => s.progress.pair);
  const owned = useGame((s) => s.progress.owned);
  const seen = useGame((s) => s.progress.seen);
  const clears = useGame((s) => s.progress.clears);
  const [tab, setTab] = useState<Tab>('decor');
  const [hint, setHint] = useState(HINT);
  /** The one that just hopped, and a count so the same one can hop again */
  const [hop, setHop] = useState<{ id: string; n: number } | null>(null);
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);
  /** Following the finger outside the house: the sticker's picture under it, in screen pixels */
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number; w: number } | null>(null);
  /** A sticker being moved inside the house, before it is let go */
  const [moving, setMoving] = useState<{ id: string; x: number; y: number; out: boolean } | null>(null);
  const [over, setOver] = useState<'scene' | 'drawer' | null>(null);
  const drag = useRef<Drag | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hintTimer = useRef(0);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const say = (text: string) => {
    setHint(text);
    clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(HINT), 4200);
  };
  const bounce = (id: string) => setHop((h) => ({ id, n: (h?.n ?? 0) + 1 }));
  /** Tapping something in the house: it hops, says its name and makes its sound */
  const poke = (id: string) => {
    bounce(id);
    if (isDecor(id)) sfx.boing();
    else sfx.hello();
  };
  const toHouse = (cx: number, cy: number) => {
    const r = sceneRef.current?.getBoundingClientRect();
    if (!r) return { x: HOUSE_W / 2, y: HOUSE_H };
    return { x: ((cx - r.left) / r.width) * HOUSE_W, y: ((cy - r.top) / r.height) * HOUSE_H };
  };
  const ghostWidth = (id: string) => ((sceneRef.current?.getBoundingClientRect().width ?? HOUSE_W) * stickerSize(id).w) / HOUSE_W;

  function tapTile(id: string) {
    const name = nameOf(id);
    const why = cannotPlace(id);
    if (why === 'roof') {
      poke(id);
      say(`${name}在屋頂上`);
    } else if (why === 'there') {
      poke(id);
      say(`${name}已經在家裡了`);
    } else if (why === 'full') {
      sfx.bad();
      setShake((s) => ({ id, n: (s?.n ?? 0) + 1 }));
      say(`家裡放滿 ${HOUSE_CAP} 樣了，先拖一些回抽屜`);
    } else if (putInHouse(id)) {
      bounce(id);
      say(`${name}跳進院子了`);
    }
  }

  function down(e: PointerEvent<HTMLElement>, from: Drag['from'], id: string) {
    if (e.button > 0 || !e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const it = getState().progress.house.placed.find((s) => s.id === id);
    const at = toHouse(e.clientX, e.clientY);
    drag.current = { from, id, x0: e.clientX, y0: e.clientY, moved: false, carry: false, dx: it ? it.x - at.x : 0, dy: it ? it.y - at.y : 0 };
  }

  function move(e: PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
      d.moved = true;
      d.carry = d.from === 'tile' && cannotPlace(d.id) === null;
      if (d.carry || d.from === 'stk') {
        sfx.lift();
        if (d.from === 'stk') say('拖回抽屜就收起來');
      }
    }
    if (d.from === 'stk') {
      const out = !inside(sceneRef.current, e.clientX, e.clientY);
      const at = toHouse(e.clientX, e.clientY);
      setMoving({ id: d.id, ...clampSpot(d.id, at.x + d.dx, at.y + d.dy), out });
      setGhost(out ? { id: d.id, x: e.clientX, y: e.clientY, w: ghostWidth(d.id) } : null);
      setOver(inside(drawerRef.current, e.clientX, e.clientY) ? 'drawer' : null);
    } else if (d.carry) {
      setGhost({ id: d.id, x: e.clientX, y: e.clientY, w: ghostWidth(d.id) });
      setOver(inside(sceneRef.current, e.clientX, e.clientY) ? 'scene' : null);
    }
  }

  function end(e: PointerEvent<HTMLElement>, cancelled: boolean) {
    const d = drag.current;
    drag.current = null;
    setGhost(null);
    setMoving(null);
    setOver(null);
    if (!d || cancelled) return;
    const name = nameOf(d.id);
    if (d.from === 'tile') {
      if (d.carry) {
        if (!inside(sceneRef.current, e.clientX, e.clientY)) return;
        // The ghost is centred on the finger, so its feet are half its height below
        const at = toHouse(e.clientX, e.clientY);
        if (putInHouse(d.id, { x: at.x, y: at.y + stickerSize(d.id).h / 2 })) {
          bounce(d.id);
          say(`${name}貼好了`);
        }
      } else if (!d.moved) tapTile(d.id);
      return;
    }
    if (!d.moved) poke(d.id);
    else if (inside(drawerRef.current, e.clientX, e.clientY)) {
      putAway(d.id);
      say(`${name}收起來了`);
    } else {
      const at = toHouse(e.clientX, e.clientY);
      moveInHouse(d.id, at.x + d.dx, at.y + d.dy);
    }
  }

  const handlers = (from: Drag['from'], id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => down(e, from, id),
    onPointerMove: move,
    onPointerUp: (e: PointerEvent<HTMLElement>) => end(e, false),
    onPointerCancel: (e: PointerEvent<HTMLElement>) => end(e, true),
  });

  /** Keys for a sticker in the house: arrows move it, Delete puts it away (Enter and Space tap it) */
  function key(e: KeyboardEvent, id: string) {
    const it = getState().progress.house.placed.find((s) => s.id === id);
    if (!it) return;
    const step: Record<string, [number, number]> = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
    if (step[e.key]) {
      e.preventDefault();
      moveInHouse(id, it.x + step[e.key][0], it.y + step[e.key][1]);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      putAway(id);
      say(`${nameOf(id)}收起來了`);
    }
  }

  const bds = backdrops(seen, clears);
  // Drawn back to front by how low they stand; the order is kept while one is carried, so it is never re-inserted
  const order = [...house.placed].sort((a, b) => a.y - b.y);
  const bubbleAt = (() => {
    if (!hop) return null;
    const r = ROOF_SPOTS[pair.indexOf(hop.id)];
    const s = r ?? house.placed.find((p) => p.id === hop.id);
    if (!s) return null;
    return { x: s.x, y: s.y - stickerSize(hop.id).h * (r ? 1.25 : 1) };
  })();
  const tile = (id: string, art: ReactNode) => {
    const there = house.placed.some((s) => s.id === id);
    const roof = pair.includes(id);
    const cls = ['hTile', there && 'home', roof && 'roof', shake?.id === id && 'hShake'].filter(Boolean).join(' ');
    return (
      <button
        key={shake?.id === id ? `${id}:${shake.n}` : id}
        type="button"
        className={cls}
        data-id={id}
        aria-label={`${nameOf(id)}${roof ? '（在屋頂上）' : there ? '（在家裡）' : ''}`}
        onClick={(e) => e.detail === 0 && tapTile(id)}
        {...handlers('tile', id)}
      >
        {art}
        {(there || roof) && <span className="hTag">{roof ? '屋頂' : '在家'}</span>}
      </button>
    );
  };

  return (
    <section id="house" className="screen">
      <header className="bar">
        <button type="button" className="iconBtn" data-go="home" aria-label="地圖" onClick={() => go('home')}>
          <Icon name="map" />
          <span>地圖</span>
        </button>
        <div className="title">西薩的家</div>
        <span className="coin hCount" role="img" aria-label={`家裡有 ${house.placed.length} 樣，最多 ${HOUSE_CAP} 樣`}>
          <b className="num" id="houseCount">
            {house.placed.length}
          </b>
          <span className="num">/{HOUSE_CAP}</span>
        </span>
      </header>
      <div className="hStage">
        <div ref={sceneRef} id="houseScene" className={over === 'scene' ? 'hScene over' : 'hScene'} data-bd={house.bd}>
          {house.bd === SKY ? <SkyArt /> : <img className="hBd" src={sceneUrl(house.bd, 'day')} alt="" draggable={false} />}
          <HouseArt />
          {/* The pair on the ridge is the pair on the journeys; they stay put */}
          {pair.map((id, i) => (
            <button
              key={id}
              type="button"
              className="hStk roof"
              data-roof={i}
              aria-label={nameOf(id)}
              style={{ left: pct(ROOF_SPOTS[i].x, HOUSE_W), top: pct(ROOF_SPOTS[i].y, HOUSE_H), width: pct(64, HOUSE_W), zIndex: ROOF_SPOTS[i].y }}
              onClick={() => poke(id)}
            >
              <span key={hop?.id === id ? hop.n : 0} className={hop?.id === id ? 'hIn hop' : 'hIn'}>
                <svg viewBox="-46 -100 92 104" aria-hidden="true">
                  <g className="bob">
                    <ShisaArt v={VARIANT_BY_ID[id]} open={i === 0} />
                  </g>
                </svg>
              </span>
            </button>
          ))}
          {order.map((s) => {
            const m = moving?.id === s.id ? moving : null;
            const at = m ?? s;
            return (
              <button
                key={s.id}
                type="button"
                className={m ? 'hStk lift' : 'hStk'}
                data-id={s.id}
                aria-label={nameOf(s.id)}
                style={{
                  left: pct(at.x, HOUSE_W),
                  top: pct(at.y, HOUSE_H),
                  width: pct(stickerSize(s.id).w, HOUSE_W),
                  zIndex: m ? 1000 : s.y,
                  visibility: m?.out ? 'hidden' : undefined,
                }}
                onClick={(e) => e.detail === 0 && poke(s.id)}
                onKeyDown={(e) => key(e, s.id)}
                {...handlers('stk', s.id)}
              >
                <span key={hop?.id === s.id ? hop.n : 0} className={hop?.id === s.id ? 'hIn hop' : 'hIn'}>
                  <StickerArt id={s.id} />
                </span>
              </button>
            );
          })}
          {hop && bubbleAt && (
            <span
              key={hop.n}
              className="hBubble"
              style={{ left: pct(Math.min(Math.max(bubbleAt.x, 50), HOUSE_W - 50), HOUSE_W), top: pct(Math.max(bubbleAt.y, 24), HOUSE_H) }}
            >
              {nameOf(hop.id)}
            </span>
          )}
        </div>
      </div>
      <div ref={drawerRef} id="houseDrawer" className={over === 'drawer' ? 'hDrawer over' : 'hDrawer'}>
        <div className="hTabs" role="tablist" aria-label="抽屜">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`htab-${t.id}`}
              className="hTab"
              aria-selected={tab === t.id}
              aria-controls="houseTiles"
              onClick={() => setTab(t.id)}
            >
              {t.id === 'decor' ? <DecorIcon id="hibiscus" /> : t.id === 'shisa' ? <ShisaIcon v={VARIANT_BY_ID[pair[0]]} open /> : <Icon name="picture" />}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className={tab === 'bd' ? 'hTiles bds' : 'hTiles'} id="houseTiles" role="tabpanel" aria-labelledby={`htab-${tab}`}>
          {tab === 'decor' && DECOR.map((d) => tile(d.id, <DecorIcon id={d.id} />))}
          {tab === 'shisa' && VARIANTS.filter((v) => owned.includes(v.id)).map((v) => tile(v.id, <ShisaIcon v={v} open={false} />))}
          {tab === 'bd' &&
            bds.map((b) => (
              <button
                key={b.id}
                type="button"
                className={['hTile', 'bd', b.open ? '' : 'locked', house.bd === b.id ? 'on' : ''].filter(Boolean).join(' ')}
                data-bd={b.id}
                aria-pressed={house.bd === b.id}
                aria-label={b.open ? b.name : `${b.name}（還沒去過）`}
                onClick={() => {
                  if (setBackdrop(b.id)) say(`背景換成${b.name}`);
                  else say(`去${b.name}過一站，就能用那裡的畫當背景`);
                }}
              >
                {b.id === SKY ? (
                  <SkyArt className="hThumb" />
                ) : b.open ? (
                  <img className="hThumb" src={sceneUrl(b.id, 'day')} alt="" loading="lazy" draggable={false} />
                ) : (
                  <Icon name="lock" />
                )}
                <span className="hName">{b.name}</span>
              </button>
            ))}
        </div>
        <p className="hHint" aria-live="polite">
          {hint}
        </p>
      </div>
      {ghost && (
        <div className="hGhost" style={{ left: ghost.x, top: ghost.y, width: ghost.w }}>
          <StickerArt id={ghost.id} />
        </div>
      )}
    </section>
  );
}
