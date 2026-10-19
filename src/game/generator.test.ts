import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stageCfg } from '../content/zones';

// Stands in for the level worker: answers each request with a marker level and counts the requests
let posted: { cfg: unknown; seed: number }[] = [];
class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage({ id, cfg, seed }: { id: number; cfg: unknown; seed: number }) {
    posted.push({ cfg, seed });
    setTimeout(() => this.onmessage?.({ data: { id, level: { seed } } }));
  }
}

const load = () => import('./generator');

describe('preparing the next level', () => {
  beforeEach(() => {
    posted = [];
    vi.resetModules();
    vi.stubGlobal('Worker', FakeWorker);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hands over the level prepared for the same stop without asking the worker again', async () => {
    const { generateLevel, prepareLevel } = await load();
    const cfg = stageCfg(1, 2, ['ladder']);
    prepareLevel(cfg, 42);
    expect(posted).toHaveLength(1);
    await expect(generateLevel(cfg, 42)).resolves.toEqual({ seed: 42 });
    expect(posted).toHaveLength(1);
  });

  it('asks the worker afresh when the stop or the seed differs from the prepared one', async () => {
    const { generateLevel, prepareLevel } = await load();
    prepareLevel(stageCfg(1, 2, ['ladder']), 42);
    await expect(generateLevel(stageCfg(1, 2, []), 42)).resolves.toEqual({ seed: 42 });
    await expect(generateLevel(stageCfg(1, 2, ['ladder']), 43)).resolves.toEqual({ seed: 43 });
    expect(posted).toHaveLength(3);
  });

  it('uses a prepared level only once', async () => {
    const { generateLevel, prepareLevel } = await load();
    const cfg = stageCfg(0, 1, []);
    prepareLevel(cfg, 7);
    await generateLevel(cfg, 7);
    await generateLevel(cfg, 7);
    expect(posted).toHaveLength(2);
  });

  it('prepares nothing when there is no worker, so the screen never blocks early', async () => {
    vi.stubGlobal('Worker', undefined);
    const generate = vi.fn(() => ({ seed: 0 }));
    vi.doMock('../engine', async (orig) => ({ ...(await orig<typeof import('../engine')>()), generate }));
    const { generateLevel, prepareLevel } = await load();
    const cfg = stageCfg(9, 4, ['tide']);
    prepareLevel(cfg, 1);
    expect(generate).not.toHaveBeenCalled();
    await generateLevel(cfg, 1);
    expect(generate).toHaveBeenCalledTimes(1);
    vi.doUnmock('../engine');
  });
});
