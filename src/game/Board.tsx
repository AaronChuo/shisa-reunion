import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PieceArt } from '../art/PieceArt';
import { Background, GateArt, Plate, StarSand, TrayBase, Urchin, Water } from '../art/Scene';
import { ShisaArt } from '../art/Shisa';
import { sfx } from '../audio/sfx';
import { speak } from '../audio/speech';
import { VARIANT_BY_ID } from '../content/shisa';
import { ZONES } from '../content/zones';
import { cellsOf, makeGrid, type Placement, sizeOf } from '../engine';
import { useGame } from '../state/store';
import { bad, canLiftPiece, pickStar, place, say, shake, walkDone } from './actions';
import { beginPan, revealScreenX, type ScrollView, stopTour, tourField, viewFor } from './boardView';
import { beginDrag, clearPreview, hoverPreview, useDrag } from './drag';
import { boardViewBox, C, landingAt, M, Y0 } from './geometry';
import { animateWalk, heroTransform } from './walk';

function Ghost({ p, color, opacity }: { p: Placement; color: string; opacity: number }) {
  const { h } = sizeOf(p.t, p.o);
  return (
    <g pointerEvents="none">
      <g transform={`translate(${M + p.x * C},${Y0 - (p.y + h) * C})`} opacity={opacity}>
        <PieceArt t={p.t} o={p.o} />
      </g>
      {cellsOf(p.t, p.o).map(([dx, dy]) => (
        <rect
          key={`${dx},${dy}`}
          className="ghostLine"
          x={M + (p.x + dx) * C + 3}
          y={Y0 - (p.y + dy + 1) * C + 3}
          width={C - 6}
          height={C - 6}
          rx={12}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray="14 10"
        />
      ))}
    </g>
  );
}

const HEART_COLORS = ['#E2513C', '#F3A83F', '#2D8FD0', '#8C56AA', '#3DA399', '#FF8FB1'];

function Hearts({ x, y }: { x: number; y: number }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
        const r = 90 + Math.random() * 130;
        return { i, dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r), rot: Math.round(Math.random() * 240 - 120) };
      }),
    [],
  );
  return (
    <g pointerEvents="none">
      {hearts.map((h) => (
        <g key={h.i} transform={`translate(${x},${y})`}>
          <path
            className="pt"
            style={{ ['--dx' as string]: `${h.dx}px`, ['--dy' as string]: `${h.dy}px`, ['--r' as string]: `${h.rot}deg`, animationDelay: `${h.i * 25}ms` }}
            d="M0,7 C-14,-4 -7,-15 0,-6 C7,-15 14,-4 0,7Z"
            fill={HEART_COLORS[h.i % HEART_COLORS.length]}
          />
        </g>
      ))}
    </g>
  );
}

export function Board() {
  const run = useGame((s) => s.progress.run);
  const pair = useGame((s) => s.progress.pair);
  const ui = useGame((s) => s.ui);
  const land = useDrag((s) => s.land);
  const dragInfo = useDrag((s) => s.info);
  const heroRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ScrollView | null>(null);
  const lv = run?.level ?? null;
  const cols = lv?.w ?? 6;

  // Fit the whole field, or scroll sideways when cells would get too small to drag onto
  useLayoutEffect(() => {
    const wrap = boxRef.current?.parentElement;
    if (!wrap) return;
    const measure = () => {
      const next = viewFor(wrap.clientWidth, wrap.clientHeight, cols);
      setView((cur) => (cur?.width === next?.width && cur?.height === next?.height ? cur : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [cols]);

  // A new stop on a scrolling board: take a slow look across the field first
  const scrolling = !!view;
  useEffect(() => {
    if (!scrolling || !lv) return;
    tourField(lv.hero.x > lv.w / 2);
    return stopTour;
  }, [scrolling, lv]);

  // Keep the walking hero in view
  useEffect(() => {
    if (!scrolling || !ui.walking) return;
    let raf = 0;
    const follow = () => {
      const r = heroRef.current?.getBoundingClientRect();
      if (r) revealScreenX(r.left + r.width / 2, 90);
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [scrolling, ui.walking]);

  const g = useMemo(() => (lv && run ? makeGrid(lv, run.placed, run.moves) : null), [lv, run]);
  const lastWater = useRef(0);
  const rise = !!g && g.water > lastWater.current;
  useEffect(() => {
    lastWater.current = g?.water ?? 0;
  });

  useEffect(() => {
    if (!ui.walking || !lv) return;
    return animateWalk(heroRef.current, ui.walking, lv, walkDone, pickStar);
  }, [ui.walking, lv]);

  if (!run || !lv || !g)
    return (
      <div className="boardScroll" ref={boxRef}>
        <svg id="board" ref={svgRef} viewBox={boardViewBox(6)} />
      </div>
    );

  const pieces = [...lv.fixed.map((p, i) => ({ p, fixed: true, i })), ...run.placed.map((p, i) => ({ p, fixed: false, i }))].sort(
    (a, b) => a.p.y - b.p.y || a.p.x - b.p.x,
  );
  const hero = VARIANT_BY_ID[pair[0]];
  const goal = VARIANT_BY_ID[pair[1]];
  const heroPos = ui.heroAt ?? { x: lv.hero.x + 0.5, y: lv.hero.y, flip: false };
  const roadIdx = run.road?.[run.si];
  const road = roadIdx === null || roadIdx === undefined ? null : ZONES[run.zi].roads[roadIdx];
  const landPiece = land && (dragInfo ?? (ui.sel >= 0 ? { t: lv.inv[ui.sel], o: run.orient[ui.sel] } : null));

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const st = useGame.getState();
    stopTour();
    if (st.ui.busy || useDrag.getState().info || !svgRef.current) return;
    const target = e.target as Element;
    const loose = target.closest('[data-pi]');
    if (loose) {
      e.preventDefault();
      const idx = Number(loose.getAttribute('data-pi'));
      if (!canLiftPiece(idx)) {
        shake(`pi:${idx}`);
        bad('上面還壓著別的東西');
        return;
      }
      const p = run?.placed[idx];
      if (p) beginDrag(e, { src: 'board', k: p.k, idx, t: p.t, o: p.o }, svgRef.current);
      return;
    }
    // Tapping a shisa (with no block picked) makes it say its name
    const who = target.closest('#hero, #goal');
    if (who && st.ui.sel < 0) {
      sfx.hello();
      if (st.progress.sound) speak('西薩！', undefined, 'shisa');
      return;
    }
    const fixed = target.closest('[data-fixed]');
    const touchFixed = () => {
      if (!fixed) return;
      shake(`fixed:${fixed.getAttribute('data-fixed')}`);
      say('這塊是固定的，搬不動');
    };
    // On a scrolling board, dragging empty ground (or a fixed block) pans the field
    if (st.ui.sel < 0 && scrolling && beginPan(e, touchFixed)) return;
    if (fixed && st.ui.sel < 0) {
      touchFixed();
      return;
    }
    const sel = st.ui.sel;
    const r = st.progress.run;
    if (sel >= 0 && r?.level) {
      const t = r.level.inv[sel];
      const o = r.orient[sel];
      const at = landingAt(e.clientX, e.clientY, t, o);
      if (at?.ok) place(sel, t, o, at.x, at.y, true);
      else bad(at?.full ? '這裡放不下了' : '這樣會倒下來喔');
    }
  }

  return (
    <div className={view ? 'boardScroll scrollX' : 'boardScroll'} ref={boxRef}>
      <svg
        id="board"
        ref={svgRef}
        viewBox={boardViewBox(lv.w)}
        style={view ? { width: view.width, height: view.height } : undefined}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="遊戲盤面"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.pointerType === 'mouse' && hoverPreview(e.clientX, e.clientY)}
        onPointerLeave={clearPreview}
      >
        <Background w={lv.w} time={road?.time ?? 'day'} sight={road?.sight ?? null} />
        <TrayBase w={lv.w} />
        {lv.urchin.map((x) => (
          <Urchin key={`u${x}`} cx={M + x * C + 50} cy={Y0 - 17} />
        ))}
        {lv.gate && (
          <>
            <Plate px={lv.gate.px} on={g.gateOpen} />
            <GateArt gate={lv.gate} open={g.gateOpen} />
          </>
        )}
        {pieces.map(({ p, fixed, i }) => {
          const { h } = sizeOf(p.t, p.o);
          const target = fixed ? `fixed:${i}` : `pi:${i}`;
          const shaking = ui.shake?.target === target;
          const cls = ['pc'];
          if (!fixed) cls.push('loose');
          if (!fixed && i === ui.justPlaced) cls.push('drop');
          if (!fixed && ui.hint?.type === 'lift' && ui.hint.pi === i) cls.push('hinted');
          if (shaking) cls.push('shake');
          return (
            <g
              key={`${target}:${p.t}${p.o}@${p.x},${p.y}`}
              transform={`translate(${M + p.x * C},${Y0 - (p.y + h) * C})`}
              {...(fixed ? { 'data-fixed': i } : { 'data-pi': i })}
            >
              <g className={cls.join(' ')} key={shaking ? ui.shake?.n : 0}>
                <PieceArt t={p.t} o={p.o} />
              </g>
            </g>
          );
        })}
        {lv.stars.map((p, i) => (
          <StarSand key={`s${p.x},${p.y}`} cx={M + (p.x + 0.5) * C} cy={Y0 - p.y * C} taken={ui.picked.includes(i)} />
        ))}
        {ui.hint?.type === 'put' && <Ghost p={ui.hint.p} color="#E2703A" opacity={0.5} />}
        {lv.tide && <Water w={lv.w} level={g.water} rise={rise} />}
        <g id="goal" transform={`translate(${M + (lv.goal.x + 0.5) * C},${Y0 - lv.goal.y * C})`}>
          <g className={ui.cheer ? 'bob cheer' : 'bob'}>
            <ShisaArt v={goal} open={false} />
          </g>
        </g>
        <g id="hero" ref={heroRef} transform={heroTransform(heroPos)}>
          <g className={ui.cheer ? 'bob cheer' : 'bob'}>
            <ShisaArt v={hero} open />
          </g>
        </g>
        {land && landPiece && (
          <Ghost p={{ t: landPiece.t, o: landPiece.o, x: land.x, y: land.y }} color={land.ok ? '#2E9D6A' : '#CF4436'} opacity={land.ok ? 0.55 : 0.3} />
        )}
        {ui.cheer && <Hearts x={M + (lv.goal.x + 0.5) * C} y={Y0 - lv.goal.y * C - 70} />}
      </svg>
    </div>
  );
}
