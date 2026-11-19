import { describe, expect, it } from 'vitest';
import type { PieceType } from '../engine';
import { allHints, coachLine, lastStopLine, putLine, stopLine } from './hints';
import { PIECE_NAMES } from './text';
import { type Element, planRun, relax, STAGES, stageCfg, ZONES } from './zones';

const ALL: Element[] = ['ladder', 'spring', 'vine', 'slide', 'long', 'urchin', 'tide', 'gate', 'star'];
const SEEDS = Array.from({ length: 60 }, (_, i) => i * 7717 + 3);
const said = new Set(allHints().map((h) => h.text));

describe('what the shisa says while playing', () => {
  it('words each line the way the bubble shows it', () => {
    expect(stopLine(3, 0)).toBe('這一站要用 3 塊積木');
    expect(stopLine(2, 1)).toBe('這一站要用 2 塊積木，要先撿星砂');
    expect(lastStopLine('國際通', 2)).toBe('最後一站：國際通，要先撿 2 堆星砂');
    expect(coachLine('素燒西薩', '青釉西薩', 1)).toBe('把積木拖進來，幫素燒西薩先撿星砂，再走到青釉西薩身邊');
    expect(putLine('cube')).toBe('把發亮的紅型方塊放到虛線那裡');
  });

  it('lists every line any stop of any zone can start with, relaxed or not', () => {
    for (const [zi, Z] of ZONES.entries()) {
      for (const seed of SEEDS) {
        const plan = planRun(zi, ALL, seed);
        for (let si = 0; si < STAGES; si++) {
          const cfg = stageCfg(zi, si, plan[si] ?? []);
          // Every step a stop can be eased by when it can't be built in time
          for (let step = 0; step <= 5; step++) {
            const c = relax(cfg, step);
            const line = si === STAGES - 1 ? lastStopLine(Z.boss.name, c.stars) : stopLine(c.k, c.stars);
            expect(said, `${Z.id} stop ${si + 1}, eased ${step}`).toContain(line);
          }
        }
      }
    }
  });

  it('lists the hint for every kind of block', () => {
    for (const t of Object.keys(PIECE_NAMES) as PieceType[]) expect(said).toContain(putLine(t));
  });

  it('lists each line once', () => {
    expect(said.size).toBe(allHints().length);
  });
});
