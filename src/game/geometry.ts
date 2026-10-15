import { H, type Level, makeGrid, type PieceType, restY, sizeOf, stable } from '../engine';
import { currentRun } from '../state/store';

/** Board drawing units: cell size, left margin, y of the tray top */
export const C = 100;
export const M = 40;
export const Y0 = 640;

export const boardWidth = (w: number): number => 2 * M + w * C;
export const boardViewBox = (w: number): string => `0 30 ${boardWidth(w)} 690`;

/** SVG x/y of a cell's top-left corner */
export const cellX = (x: number): number => M + x * C;
export const cellTop = (y: number): number => Y0 - (y + 1) * C;

export interface Landing {
  x: number;
  y: number;
  ok: boolean;
  full?: boolean;
}

function boardEl(): SVGSVGElement | null {
  return document.getElementById('board') as SVGSVGElement | null;
}

export function toBoard(clientX: number, clientY: number): DOMPoint | null {
  const b = boardEl();
  const ctm = b?.getScreenCTM();
  if (!b || !ctm) return null;
  return new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
}

/** Screen pixels per board unit */
export function boardScale(): number {
  return boardEl()?.getScreenCTM()?.a ?? 1;
}

/** Where a piece centred on the pointer would come to rest, and whether it would stand */
export function landingAt(clientX: number, clientY: number, t: PieceType, o: number): Landing | null {
  const run = currentRun();
  const lv: Level | null | undefined = run?.level;
  const pt = toBoard(clientX, clientY);
  if (!run || !lv || !pt) return null;
  if (pt.x < -20 || pt.x > boardWidth(lv.w) + 20 || pt.y < 20 || pt.y > 735) return null;
  const { w, h } = sizeOf(t, o);
  const x = Math.max(0, Math.min(lv.w - w, Math.round((pt.x - M) / C - w / 2)));
  const y = Math.round((Y0 - pt.y) / C - h / 2);
  const g = makeGrid(lv, run.placed, run.moves);
  const ry = restY(g, t, o, x, y);
  if (ry === null) return { x, y: Math.max(0, Math.min(H - h, y)), ok: false, full: true };
  return { x, y: ry, ok: stable(g, t, o, x, ry) };
}
