import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CoinArt, TapHand } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { sfx } from '../audio/sfx';
import { type Series, VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { rng } from '../engine';
import { capsuleOut, insertCoin, openCapsule, releaseCapsule } from '../game/actions';
import { useGame } from '../state/store';
import { NUDGE_MS } from '../ui/Cta';
import { useIdle } from '../ui/useIdle';
import { addBall, agitate, asleep, type Dome, inside, makeWorld, release, STEP, step, type World } from './physics';

// Drawing units of the machine (viewBox 0 -12 310 452)
const VB = { x: 0, y: -12, w: 310, h: 452 };
const DOME: Dome = { cx: 155, cy: 165, R: 94, r: 18 };
const CRANK = { x: 112, y: 346, r: 30 };
const SLOT = { x: 215, y: 342 };
const OUTLET = { x: 206, y: 398 };
const PURSE = { x: 284, y: 368 };
/** Capsule shells come in bright colours that say nothing about what's inside, like a real machine */
const SHELLS = ['#E2513C', '#F3A83F', '#2D8FD0', '#3FA36B', '#8C56AA', '#FF8FB1', '#F2C43A', '#3DA399', '#E2703A', '#6FA8D6'];
/** Degrees per click of the ratchet, and per capsule */
const NOTCH = 90;
const TURN = 360;

/** Absolute placement of an overlay button over a spot of the drawing */
const over = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${((x - w / 2 - VB.x) / VB.w) * 100}%`,
  top: `${((y - h / 2 - VB.y) / VB.h) * 100}%`,
  width: `${(w / VB.w) * 100}%`,
  height: `${(h / VB.h) * 100}%`,
});

const angleAt = (el: Element, e: { clientX: number; clientY: number }) => {
  const r = el.getBoundingClientRect();
  return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
};
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

function Capsule({ color, r }: { color: string; r: number }) {
  return (
    <>
      <g>
        <circle r={r} fill="#fff" stroke="#6E7F7C" strokeWidth={2} />
        <path d={`M${-r},0 A${r},${r} 0 0 1 ${r},0 Z`} fill={color} stroke="#6E7F7C" strokeWidth={2} />
      </g>
      <circle cx={-r * 0.38} cy={-r * 0.45} r={r * 0.22} fill="#fff" opacity={0.7} />
    </>
  );
}

/**
 * The gacha machine you can work with your hands: drag a coin into the slot, turn the crank round with a finger
 * (each quarter turn clicks, a full turn drops a capsule), and watch the capsules tumble and roll in the dome.
 * Tapping still works everywhere for children who can't drag or turn yet.
 */
export function Machine({ series }: { series: Series }) {
  const owned = useGame((s) => s.progress.owned);
  const tokens = useGame((s) => s.progress.tokens);
  const phase = useGame((s) => s.ui.pull);
  const spin = useGame((s) => s.ui.spin);
  const capColor = useGame((s) => s.ui.capColor);
  const pulled = useGame((s) => s.ui.pulled);
  const left = useMemo(() => VARIANTS.filter((v) => v.series === series.id && !owned.includes(v.id)).length, [series.id, owned]);

  const rand = useRef(rng(7));
  const world = useRef<World | null>(null);
  const colors = useRef(new Map<number, string>());
  const els = useRef(new Map<number, SVGGElement>());
  const raf = useRef(0);
  const lastClack = useRef(0);
  const [ids, setIds] = useState<number[]>([]);
  const [angle, setAngle] = useState(0);
  const turned = useRef(0);
  const [locked, setLocked] = useState(0);
  const [coinAt, setCoinAt] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const idle = useIdle(NUDGE_MS, phase);

  // ---------- the physics loop: runs while something moves, sleeps when the pile is still ----------
  const wake = () => {
    if (raf.current) return;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      const w = world.current;
      if (!w) {
        raf.current = 0;
        return;
      }
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      let knock = 0;
      const gone: number[] = [];
      for (; acc >= STEP; acc -= STEP) knock = Math.max(knock, step(w, gone));
      for (const b of w.balls) {
        const el = els.current.get(b.id);
        if (!el) continue;
        el.setAttribute('transform', `translate(${b.x.toFixed(1)},${b.y.toFixed(1)})`);
        (el.firstChild as SVGGElement | null)?.setAttribute('transform', `rotate(${((b.a * 180) / Math.PI).toFixed(1)})`);
      }
      if (knock > 80 && now - lastClack.current > 70) {
        lastClack.current = now;
        sfx.clack(Math.min(1, knock / 500));
      }
      if (gone.length) {
        setIds(w.balls.map((b) => b.id));
        // A moment in the chute, then it lands in the tray
        window.setTimeout(capsuleOut, 380);
      }
      if (asleep(w)) raf.current = 0;
      else raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // A fresh pile poured in whenever the machine changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild only when switching machines
  useEffect(() => {
    const w = makeWorld(DOME, left, rand.current);
    world.current = w;
    colors.current = new Map(w.balls.map((b, i) => [b.id, SHELLS[(i * 3 + series.id.length) % SHELLS.length]]));
    setIds(w.balls.map((b) => b.id));
    wake();
  }, [series.id]);

  // Keep one capsule in the dome per shisa still to collect
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the count matters
  useEffect(() => {
    const w = world.current;
    if (!w || phase === 'drop') return;
    while (inside(w).length > left) w.balls.splice(w.balls.indexOf(inside(w)[0]), 1);
    while (inside(w).length < left) {
      const id = addBall(w, rand.current);
      if (id === null) break;
      colors.current.set(id, SHELLS[id % SHELLS.length]);
    }
    setIds(w.balls.map((b) => b.id));
    wake();
  }, [left]);

  // ---------- the crank ----------
  const advance = (deg: number) => {
    const w = world.current;
    if (!w || deg <= 0) return;
    const before = turned.current;
    turned.current += deg;
    setAngle((a) => a + deg);
    // Every notch the stirrer kicks the capsules; turning faster shakes them more
    agitate(w, Math.min(160, deg * 6), rand.current);
    if (Math.floor(turned.current / NOTCH) > Math.floor(before / NOTCH)) {
      sfx.ratchet();
      agitate(w, 320, rand.current);
    }
    wake();
    if (turned.current >= TURN) {
      turned.current = 0;
      const id = release(w);
      if (id !== null && releaseCapsule(colors.current.get(id) ?? SHELLS[0]) === null) {
        // Shouldn't happen (no coin), but never let a capsule out for free
        const b = w.balls.find((x) => x.id === id);
        if (b) b.out = false;
      }
    }
  };

  /** Turns the crank on its own by `deg`, smoothly */
  const tween = (deg: number, ms: number) => {
    const t0 = performance.now();
    let done = 0;
    const tick = (now: number) => {
      const target = Math.min(1, (now - t0) / ms) * deg;
      advance(target - done);
      done = target;
      if (target < deg && useGame.getState().ui.pull === 'ready') requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // The main button (or Enter on the crank) asks for one whole turn
  // biome-ignore lint/correctness/useExhaustiveDependencies: react only to new requests
  useEffect(() => {
    if (spin && phase === 'ready') tween(TURN - turned.current, 1100);
  }, [spin]);
  useEffect(() => {
    if (phase !== 'ready') turned.current = 0;
  }, [phase]);

  const drag = useRef<{ prev: number; moved: number } | null>(null);
  const crankDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (phase !== 'ready') {
      // No coin yet: the crank won't budge, and the coin gets pointed at
      setLocked((n) => n + 1);
      sfx.bad();
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { prev: angleAt(e.currentTarget, e), moved: 0 };
  };
  const crankMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const a = angleAt(e.currentTarget, e);
    const delta = wrap(a - d.prev);
    d.prev = a;
    d.moved += Math.abs(delta);
    // A ratchet: it only turns one way (clockwise); turning back just slips
    if (delta > 0) advance(delta);
  };
  const crankUp = () => {
    const d = drag.current;
    drag.current = null;
    // A plain tap turns it one notch
    if (d && d.moved < 12 && phase === 'ready') tween(NOTCH, 280);
  };

  // ---------- the coin ----------
  const coinDrag = useRef<{ x0: number; y0: number; moved: boolean } | null>(null);
  const purseDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (phase !== 'idle' || tokens < 1 || !left) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    coinDrag.current = { x0: e.clientX, y0: e.clientY, moved: false };
    setCoinAt({ x: e.clientX, y: e.clientY });
  };
  const purseMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const c = coinDrag.current;
    if (!c) return;
    if (Math.hypot(e.clientX - c.x0, e.clientY - c.y0) > 8) c.moved = true;
    setCoinAt({ x: e.clientX, y: e.clientY });
  };
  const purseUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const c = coinDrag.current;
    coinDrag.current = null;
    setCoinAt(null);
    if (!c) return;
    const slot = frameRef.current?.querySelector('#slot')?.getBoundingClientRect();
    const near = slot && e.clientX > slot.left - 30 && e.clientX < slot.right + 30 && e.clientY > slot.top - 30 && e.clientY < slot.bottom + 30;
    // Dropped on the slot, or just tapped: in it goes
    if (near || !c.moved) insertCoin();
  };

  const canCoin = phase === 'idle' && tokens > 0 && left > 0;
  return (
    <div className="machineFrame" ref={frameRef}>
      <svg className="machine" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} role="img" aria-label={`${series.name}扭蛋機，裡面還有 ${left} 顆`}>
        <defs>
          <clipPath id="domeClip">
            <circle cx={DOME.cx} cy={DOME.cy} r={DOME.R + 3} />
          </clipPath>
        </defs>
        <path d="M40,74 L74,30 L236,30 L270,74 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={4} strokeLinejoin="round" />
        <path d={`M58,62${' a8,7 0 0 0 16,0'.repeat(12)}`} fill="none" stroke="#F7E2C7" strokeWidth={3} />
        <g transform="translate(155,34) scale(.42)">
          <ShisaArt v={VARIANT_BY_ID.terracotta} open />
        </g>
        <rect x={44} y={72} width={222} height={14} rx={6} fill="#F7E2C7" stroke="#86281A" strokeWidth={3} />
        <circle cx={DOME.cx} cy={DOME.cy} r={DOME.R + 6} fill="#EAF7FA" fillOpacity={0.75} />
        {/* The exit hole at the bottom of the dome */}
        <ellipse cx={DOME.cx} cy={DOME.cy + DOME.R - 4} rx={DOME.r + 6} ry={7} fill="#7FB4C0" opacity={0.6} />
        <g clipPath="url(#domeClip)" className="capsules">
          {ids.map((id) => (
            <g
              key={id}
              className="capsule"
              ref={(el) => {
                if (el) els.current.set(id, el);
                else els.current.delete(id);
              }}
            >
              <Capsule color={colors.current.get(id) ?? SHELLS[0]} r={DOME.r} />
            </g>
          ))}
        </g>
        <circle cx={DOME.cx} cy={DOME.cy} r={DOME.R + 6} fill="none" stroke="#7FB4C0" strokeWidth={6} />
        <path d="M90,108 A80,80 0 0 1 150,80" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
        <rect x={48} y={258} width={214} height={168} rx={24} fill={series.color} stroke="#173944" strokeWidth={4} />
        <rect x={70} y={272} width={170} height={34} rx={10} fill="#fff" opacity={0.92} />
        <text x={155} y={296} textAnchor="middle" fontSize={20} fontWeight={700} fill="#173944" fontFamily="LXGW WenKai TC, PingFang TC, sans-serif">
          {series.name}
        </text>
        {/* Coin slot; glows while waiting for a coin */}
        <rect x={198} y={320} width={34} height={44} rx={8} fill="#F7E2C7" stroke="#173944" strokeWidth={3} className={canCoin ? 'slotGlow' : undefined} />
        <rect x={211} y={328} width={8} height={28} rx={4} fill="#173944" />
        {phase === 'ready' && (
          <g className="coinIn">
            <g transform={`translate(${SLOT.x - 15},${SLOT.y - 30}) scale(.75)`}>
              <CoinArt />
            </g>
          </g>
        )}
        {/* Crank: turns with the finger; shakes when there's no coin in */}
        <g transform={`translate(${CRANK.x},${CRANK.y})`}>
          <g key={locked} className={locked ? 'crankLocked' : undefined}>
            <circle r={CRANK.r} fill="#fff" stroke="#173944" strokeWidth={4} className={phase === 'ready' ? 'crankGlow' : undefined} />
            <g transform={`rotate(${angle % 360})`}>
              <rect x={-8} y={-28} width={16} height={56} rx={8} fill="#E8B83A" stroke="#173944" strokeWidth={3} />
              <circle cy={-20} r={4} fill="#173944" opacity={0.35} />
            </g>
            <circle r={7} fill="#173944" />
          </g>
        </g>
        <rect x={168} y={378} width={76} height={40} rx={12} fill="#173944" opacity={0.85} />
        {phase === 'out' && capColor && (
          <g transform={`translate(${OUTLET.x},${OUTLET.y})`}>
            <g className="outCap">
              <Capsule color={capColor} r={17} />
            </g>
          </g>
        )}
        {/* The coin purse beside the machine: drag a coin from here into the slot */}
        <g transform={`translate(${PURSE.x},${PURSE.y})`} opacity={tokens > 0 ? 1 : 0.35}>
          {[2, 1, 0].map((k) =>
            tokens > k ? (
              <g key={k} transform={`translate(-15,${-15 - k * 7}) scale(.75)`}>
                <CoinArt />
              </g>
            ) : null,
          )}
        </g>
        {/* Little hands showing what to do next, after a few idle seconds */}
        {idle && canCoin && (
          <g className="coinDemo">
            <TapHand className="svgHand" x={-17} y={-3} size={44} />
          </g>
        )}
        {idle && phase === 'ready' && (
          <g transform={`translate(${CRANK.x},${CRANK.y})`}>
            <g className="crankDemo">
              <TapHand className="svgHand" x={-17} y={-CRANK.r - 6} size={44} />
            </g>
          </g>
        )}
      </svg>
      <button
        type="button"
        id="purse"
        className="hit"
        style={over(PURSE.x, PURSE.y - 8, 48, 60)}
        aria-label={`福氣幣 ${tokens} 枚，拖進投幣口`}
        disabled={!canCoin}
        onPointerDown={purseDown}
        onPointerMove={purseMove}
        onPointerUp={purseUp}
        onPointerCancel={() => {
          coinDrag.current = null;
          setCoinAt(null);
        }}
      />
      <button type="button" id="slot" className="hit" style={over(SLOT.x, SLOT.y, 48, 56)} aria-label="投幣口" disabled={!canCoin} onClick={insertCoin} />
      <button
        type="button"
        id="crank"
        className="hit round"
        style={over(CRANK.x, CRANK.y, CRANK.r * 2 + 24, CRANK.r * 2 + 24)}
        aria-label="把手，轉一圈會掉出扭蛋"
        onPointerDown={crankDown}
        onPointerMove={crankMove}
        onPointerUp={crankUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && phase === 'ready') {
            e.preventDefault();
            tween(TURN - turned.current, 1100);
          }
        }}
      />
      {phase === 'out' && pulled && (
        <button type="button" id="outCap" className="hit round" style={over(OUTLET.x, OUTLET.y, 56, 50)} aria-label="打開扭蛋" onClick={openCapsule}>
          {idle && <TapHand />}
        </button>
      )}
      {coinAt && (
        <svg className="dragCoin" viewBox="0 0 40 40" style={{ left: coinAt.x, top: coinAt.y }} aria-hidden="true">
          <CoinArt />
        </svg>
      )}
    </div>
  );
}
