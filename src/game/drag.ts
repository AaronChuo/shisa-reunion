import { useEffect } from 'react';
import { create } from 'zustand';
import type { PieceType } from '../engine';
import { getState } from '../state/store';
import { bad, liftForDrag, place, returnToTray, selectCard } from './actions';
import { type Landing, landingAt } from './geometry';

export interface DragInfo {
  src: 'tray' | 'board';
  /** inventory index */
  k: number;
  /** index into placed pieces, when dragging from the board */
  idx: number;
  t: PieceType;
  o: number;
}

interface DragState {
  info: DragInfo | null;
  moved: boolean;
  /** Pointer position (screen px) the floating piece is centred on */
  at: { x: number; y: number } | null;
  land: Landing | null;
}

export const useDrag = create<DragState>(() => ({ info: null, moved: false, at: null, land: null }));

let pointer: { id: number; sx: number; sy: number; touch: boolean } | null = null;

/** Starts tracking a press on a tray card or placed piece; it becomes a drag once the pointer moves */
export function beginDrag(e: React.PointerEvent, info: DragInfo, captureOn: Element): void {
  pointer = { id: e.pointerId, sx: e.clientX, sy: e.clientY, touch: e.pointerType !== 'mouse' };
  try {
    captureOn.setPointerCapture(e.pointerId);
  } catch {
    // capture is a nicety
  }
  useDrag.setState({ info, moved: false, at: null, land: null });
}

/** Preview where the selected tray piece would land under a hovering mouse */
export function hoverPreview(clientX: number, clientY: number): void {
  const { ui, progress } = getState();
  const run = progress.run;
  if (useDrag.getState().info || ui.busy || ui.sel < 0 || !run?.level) return;
  const t = run.level.inv[ui.sel];
  const o = run.orient[ui.sel];
  useDrag.setState({ land: landingAt(clientX, clientY, t, o) });
}

export function clearPreview(): void {
  if (!useDrag.getState().info) useDrag.setState({ land: null });
}

function onMove(e: PointerEvent): void {
  const d = useDrag.getState();
  if (!d.info || !pointer || e.pointerId !== pointer.id) return;
  if (!d.moved) {
    if (Math.hypot(e.clientX - pointer.sx, e.clientY - pointer.sy) < 8) return;
    if (d.info.src === 'board') liftForDrag(d.info.idx);
    useDrag.setState({ moved: true });
  }
  // On touch screens the piece floats above the finger so it stays visible
  const y = e.clientY - (pointer.touch ? 56 : 0);
  useDrag.setState({ at: { x: e.clientX, y }, land: landingAt(e.clientX, y, d.info.t, d.info.o) });
}

function onUp(e: PointerEvent): void {
  const d = useDrag.getState();
  if (!d.info || !pointer || e.pointerId !== pointer.id) return;
  const { info, moved, land } = d;
  pointer = null;
  useDrag.setState({ info: null, moved: false, at: null, land: null });
  if (!moved) {
    if (info.src === 'tray') selectCard(info.k);
    else returnToTray(info.idx);
    return;
  }
  if (land?.ok) place(info.k, info.t, info.o, land.x, land.y, info.src !== 'board');
  else if (land) bad(land.full ? '這裡放不下了' : '這樣會倒下來喔');
}

function onCancel(e: PointerEvent): void {
  if (pointer && e.pointerId === pointer.id) {
    pointer = null;
    useDrag.setState({ info: null, moved: false, at: null, land: null });
  }
}

/** Mount once while the board is on screen */
export function useDragController(): void {
  useEffect(() => {
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, []);
}
