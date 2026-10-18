import { useEffect, useState } from 'react';
import { TapHand } from '../art/Icons';
import { PieceArt } from '../art/PieceArt';
import { type Placement, sizeOf } from '../engine';
import { useGame } from '../state/store';
import { revealBoardX } from './boardView';
import { useDrag } from './drag';
import { C, M, Y0 } from './geometry';

interface Demo {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** The piece carried along, with the board's on-screen scale */
  piece: { p: Placement; k: number } | null;
}

const centre = (el: Element | null): [number, number] | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
};

/** Where the current hint wants the child to drag, in screen pixels */
function measure(): Demo | null {
  const { ui, progress } = useGame.getState();
  const h = ui.hint;
  const board = document.getElementById('board') as SVGSVGElement | null;
  const lv = progress.run?.level;
  if (!h || !board || !lv) return null;
  // On a scrolling board, bring the spot the hint is about into view first
  const spot = h.type === 'put' ? h.p.x + sizeOf(h.p.t, h.p.o).w / 2 : (progress.run?.placed[h.pi]?.x ?? 0) + 0.5;
  revealBoardX(M + spot * C);
  const ctm = board.getScreenCTM();
  if (!ctm) return null;
  if (h.type === 'put') {
    const from = centre(document.querySelector(`.card[data-k="${h.k}"]`));
    if (!from) return null;
    const { w, h: ph } = sizeOf(h.p.t, h.p.o);
    const to = new DOMPoint(M + (h.p.x + w / 2) * C, Y0 - (h.p.y + ph / 2) * C).matrixTransform(ctm);
    return { x0: from[0], y0: from[1], x1: to.x, y1: to.y, piece: { p: h.p, k: ctm.a } };
  }
  // A block that has to come off: carry it back to the tray
  const from = centre(document.querySelector(`[data-pi="${h.pi}"]`));
  const to = centre(document.querySelector('.tray'));
  return from && to ? { x0: from[0], y0: from[1], x1: to[0], y1: to[1], piece: null } : null;
}

/** A finger that shows the drag a hint asks for, looping until the child does it */
export function DragDemo() {
  const hint = useGame((s) => s.ui.hint);
  const modal = useGame((s) => s.ui.modal);
  const dragging = useDrag((s) => !!s.info);
  const [demo, setDemo] = useState<Demo | null>(null);
  useEffect(() => {
    if (!hint || modal) {
      setDemo(null);
      return;
    }
    const update = () => setDemo(measure());
    // Measure again once a dropped block or a tray reflow has settled
    const t = window.setTimeout(update, 350);
    update();
    window.addEventListener('resize', update);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', update);
    };
  }, [hint, modal]);
  if (!demo || dragging) return null;
  const style = {
    '--x0': `${demo.x0}px`,
    '--y0': `${demo.y0}px`,
    '--x1': `${demo.x1}px`,
    '--y1': `${demo.y1}px`,
  } as React.CSSProperties;
  const piece = demo.piece;
  const size = piece ? sizeOf(piece.p.t, piece.p.o) : null;
  return (
    <div className="dragDemo" style={style} aria-hidden="true">
      {piece && size && (
        <svg
          className="demoPiece"
          aria-hidden="true"
          width={size.w * 100 * piece.k}
          height={size.h * 100 * piece.k}
          viewBox={`0 0 ${size.w * 100} ${size.h * 100}`}
          style={{ marginLeft: (-size.w * 100 * piece.k) / 2, marginTop: (-size.h * 100 * piece.k) / 2 }}
        >
          <PieceArt t={piece.p.t} o={piece.p.o} />
        </svg>
      )}
      <TapHand className="demoHand" />
    </div>
  );
}
