import { relax } from '../content/zones';
import { type GenConfig, generate } from '../engine';

interface Request {
  id: number;
  cfg: GenConfig;
  seed: number;
}

const ctx = self as unknown as { onmessage: ((e: MessageEvent<Request>) => void) | null; postMessage(data: unknown): void };

ctx.onmessage = (e) => {
  const { id, cfg, seed } = e.data;
  ctx.postMessage({ id, level: generate(cfg, seed, relax) });
};
