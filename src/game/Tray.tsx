import { useRef } from 'react';
import { ConchIcon, Icon, ShellIcon } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { PIECE_NAMES } from '../content/text';
import { DEFS, sizeOf } from '../engine';
import { useGame } from '../state/store';
import { hint, reroll, reset, rotate, selectCard, undo } from './actions';
import { beginDrag, useDrag } from './drag';

export function Tray() {
  const run = useGame((s) => s.progress.run);
  const sel = useGame((s) => s.ui.sel);
  const hintState = useGame((s) => s.ui.hint);
  const busy = useGame((s) => s.ui.busy);
  const drag = useDrag((s) => (s.moved ? s.info : null));
  const listRef = useRef<HTMLDivElement>(null);
  if (!run?.level) return <aside className="tray" />;
  const lv = run.level;
  const used = new Set(run.placed.map((p) => p.k));
  const cards = lv.inv.map((t, k) => ({ t, k })).filter(({ k }) => !used.has(k));

  return (
    <aside className="tray">
      <div className="trayHead">可以用的積木</div>
      <div className="trayItems" ref={listRef}>
        {cards.length === 0 && <div className="empty">積木都放上去了</div>}
        {cards.map(({ t, k }) => {
          const o = run.orient[k] ?? 0;
          const { w, h } = sizeOf(t, o);
          const cls = ['card'];
          if (sel === k) cls.push('sel');
          if (hintState?.type === 'put' && hintState.k === k) cls.push('glow');
          if (drag && drag.src === 'tray' && drag.k === k) cls.push('dragging');
          return (
            // biome-ignore lint/a11y/useSemanticElements: the card is a drag source with a nested rotate button, so it can't be a <button>
            <div
              key={k}
              className={cls.join(' ')}
              data-k={k}
              role="button"
              tabIndex={0}
              aria-label={PIECE_NAMES[t]}
              aria-pressed={sel === k}
              onPointerDown={(e) => {
                if (busy || useDrag.getState().info || (e.target as Element).closest('.rot') || !listRef.current) return;
                e.preventDefault();
                beginDrag(e, { src: 'tray', k, idx: -1, t, o }, listRef.current);
              }}
              onKeyDown={(e) => {
                if (busy) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectCard(k);
                }
                if (e.key === 'r' || e.key === 'R') rotate(k);
              }}
            >
              <svg className="art" viewBox={`-8 -8 ${w * 100 + 16} ${h * 100 + 16}`} aria-hidden="true">
                <PieceArt t={t} o={o} />
              </svg>
              <span className="name">{PIECE_NAMES[t]}</span>
              {DEFS[t].orients.length > 1 && (
                <button type="button" className="rot" data-rot={k} aria-label="換方向" onClick={() => rotate(k)}>
                  <Icon name="rot" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="actions">
        <button type="button" className="iconBtn" id="undoBtn" onClick={undo} disabled={!run.hist.length}>
          <Icon name="undo" />
          <span>退一步</span>
        </button>
        <button type="button" className="iconBtn" id="resetBtn" onClick={reset} disabled={!run.placed.length && !run.moves}>
          <Icon name="reset" />
          <span>重來</span>
        </button>
        <button type="button" className="iconBtn" id="hintBtn" onClick={hint} disabled={run.shell <= 0}>
          <ShellIcon />
          <span>
            提示 <b>{run.shell}</b>
          </span>
        </button>
        <button type="button" className="iconBtn" id="rerollBtn" onClick={reroll} disabled={run.conch <= 0}>
          <ConchIcon />
          <span>
            換題 <b>{run.conch}</b>
          </span>
        </button>
      </div>
    </aside>
  );
}

/** The piece following the pointer while dragging */
export function DragLayer() {
  const d = useDrag();
  if (!d.info || !d.moved || !d.at) return <svg id="dragLayer" aria-hidden="true" />;
  const k = (document.getElementById('board') as SVGSVGElement | null)?.getScreenCTM()?.a ?? 1;
  const { w, h } = sizeOf(d.info.t, d.info.o);
  return (
    <svg id="dragLayer" aria-hidden="true">
      <g
        transform={`translate(${d.at.x - (w * 100 * k) / 2},${d.at.y - (h * 100 * k) / 2}) scale(${k})`}
        opacity={0.92}
        style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.25))' }}
      >
        <PieceArt t={d.info.t} o={d.info.o} />
      </g>
    </svg>
  );
}
