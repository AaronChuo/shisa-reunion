import { relax } from '../content/zones';
import { type GenConfig, generate, type Level } from '../engine';

// Level generation runs in a worker so the solver never freezes the screen; falls back to the main thread
let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (lv: Level) => void>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('../workers/generator.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; level: Level }>) => {
      pending.get(e.data.id)?.(e.data.level);
      pending.delete(e.data.id);
    };
    worker.onerror = () => {
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function generateLevel(cfg: GenConfig, seed: number): Promise<Level> {
  const w = getWorker();
  if (!w) return Promise.resolve(generate(cfg, seed, relax));
  const id = ++seq;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, cfg, seed });
  });
}
