// How the board fits on screen. The whole field is shown, shrunk to fit, as long as a cell stays at least MIN_FIT_CELL
// pixels wide; on a narrower screen the board keeps SCROLL_CELL-pixel cells and scrolls sideways instead, with a slow
// look across the field when a stop starts. Panning is done here rather than by the browser, because the board takes
// every touch for dragging blocks.
import { boardWidth, C } from './geometry';

/** Smallest cell, in screen pixels, at which the whole field is still shown at once */
export const MIN_FIT_CELL = 32;
/** Cell size, in screen pixels, when the board scrolls */
export const SCROLL_CELL = 40;
/** Board height in drawing units (see boardViewBox) */
const BOARD_H = 690;

export interface ScrollView {
  /** On-screen size of the board, in pixels */
  width: number;
  height: number;
}

/** The scrolling size for a board of `w` columns in a box of W×H pixels, or null when it fits */
export function viewFor(W: number, H: number, w: number): ScrollView | null {
  const bw = boardWidth(w);
  const fit = Math.min(W / bw, H / BOARD_H) * C;
  if (fit >= MIN_FIT_CELL) return null;
  const s = Math.min(SCROLL_CELL / C, H / BOARD_H);
  // Height is what limits the board: scrolling sideways would not make it any bigger
  if (s * C <= fit + 1) return null;
  return { width: Math.round(bw * s), height: Math.round(BOARD_H * s) };
}

const box = (): HTMLElement | null => document.querySelector<HTMLElement>('.boardScroll.scrollX');

let tour = 0;
/** Stops the opening look across the field (the child has touched the board) */
export function stopTour(): void {
  cancelAnimationFrame(tour);
  tour = 0;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Looks across the whole field and back to the side where the hero stands */
export function tourField(heroOnRight: boolean): void {
  const el = box();
  if (!el) return;
  stopTour();
  const max = el.scrollWidth - el.clientWidth;
  const home = heroOnRight ? max : 0;
  el.scrollLeft = home;
  if (max <= 0 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const legs = [
    { from: home, to: max - home, ms: 1500, wait: 500 },
    { from: max - home, to: home, ms: 1100, wait: 0 },
  ];
  let leg = 0;
  let t0 = performance.now() + 600;
  const step = (now: number) => {
    const L = legs[leg];
    const t = Math.min(1, Math.max(0, (now - t0) / L.ms));
    el.scrollLeft = L.from + (L.to - L.from) * ease(t);
    if (t >= 1) {
      leg += 1;
      if (leg >= legs.length) {
        tour = 0;
        return;
      }
      t0 = now + L.wait;
    }
    tour = requestAnimationFrame(step);
  };
  tour = requestAnimationFrame(step);
}

/** Scrolls so a screen x coordinate is comfortably inside the board's box */
export function revealScreenX(x: number, margin = 60): void {
  const el = box();
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (x < r.left + margin) el.scrollLeft -= r.left + margin - x;
  else if (x > r.right - margin) el.scrollLeft += x - (r.right - margin);
}

/** Scrolls so a board x coordinate (drawing units) is visible, centring it when it is off screen */
export function revealBoardX(svgX: number): void {
  const el = box();
  const svg = document.getElementById('board') as SVGSVGElement | null;
  const ctm = svg?.getScreenCTM();
  if (!el || !ctm) return;
  const x = new DOMPoint(svgX, 0).matrixTransform(ctm).x;
  const r = el.getBoundingClientRect();
  if (x < r.left + 40 || x > r.right - 40) el.scrollLeft += x - (r.left + r.width / 2);
}

let edge = 0;
let edgeDir = 0;
/**
 * While a block is dragged near the left or right edge of a scrolling board, keeps scrolling that way.
 * `onTick` runs after every scroll step so the landing preview can follow.
 */
export function edgeScroll(x: number, y: number, onTick: () => void): void {
  const el = box();
  let dir = 0;
  if (el) {
    const r = el.getBoundingClientRect();
    if (y > r.top - 40 && y < r.bottom + 40) dir = x < r.left + 44 ? -1 : x > r.right - 44 ? 1 : 0;
  }
  edgeDir = dir;
  if (!dir) {
    cancelAnimationFrame(edge);
    edge = 0;
    return;
  }
  if (edge) return;
  const step = () => {
    const b = box();
    if (!b || !edgeDir) {
      edge = 0;
      return;
    }
    const before = b.scrollLeft;
    b.scrollLeft += edgeDir * 9;
    if (b.scrollLeft !== before) onTick();
    edge = requestAnimationFrame(step);
  };
  edge = requestAnimationFrame(step);
}

export function stopEdgeScroll(): void {
  edgeDir = 0;
  cancelAnimationFrame(edge);
  edge = 0;
}

/** Pans a scrolling board by dragging empty ground; calls `onTap` instead when the finger did not really move */
export function beginPan(e: PointerEvent | React.PointerEvent, onTap: () => void): boolean {
  const el = box();
  if (!el) return false;
  stopTour();
  const id = e.pointerId;
  const x0 = e.clientX;
  const left0 = el.scrollLeft;
  let moved = false;
  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    if (!moved && Math.abs(ev.clientX - x0) < 6) return;
    moved = true;
    el.scrollLeft = left0 - (ev.clientX - x0);
  };
  const up = (ev: PointerEvent) => {
    if (ev.pointerId !== id) return;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (!moved && ev.type === 'pointerup') onTap();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  return true;
}
