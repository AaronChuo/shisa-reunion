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

function request(w: Worker, cfg: GenConfig, seed: number): Promise<Level> {
  const id = ++seq;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, cfg, seed });
  });
}

// One level kept in the making ahead of time: the next stop starts while the player is still collecting the coin
let ahead: { key: string; level: Promise<Level> } | null = null;
const jobKey = (cfg: GenConfig, seed: number): string => `${seed}:${JSON.stringify(cfg)}`;

/** Starts a level in the background so a later `generateLevel` with the same config and seed gets it right away */
export function prepareLevel(cfg: GenConfig, seed: number): void {
  // Without a worker this would block the screen now instead of later, so it waits for the real request
  const w = getWorker();
  if (w) ahead = { key: jobKey(cfg, seed), level: request(w, cfg, seed) };
}

export function generateLevel(cfg: GenConfig, seed: number): Promise<Level> {
  const key = jobKey(cfg, seed);
  if (ahead?.key === key) {
    const { level } = ahead;
    ahead = null;
    return level;
  }
  const w = getWorker();
  if (!w) return Promise.resolve(generate(cfg, seed, relax));
  return request(w, cfg, seed);
}
