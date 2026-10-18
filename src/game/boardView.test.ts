import { describe, expect, it } from 'vitest';
import { MIN_FIT_CELL, SCROLL_CELL, viewFor } from './boardView';
import { boardWidth } from './geometry';

describe('fitting the board on screen', () => {
  it('shows the whole field on phones and tablets for every zone width', () => {
    for (const w of [6, 7, 8]) {
      expect(viewFor(380, 600, w), `phone w${w}`).toBeNull();
      expect(viewFor(288, 500, w), `small phone w${w}`).toBeNull();
      expect(viewFor(800, 800, w), `tablet w${w}`).toBeNull();
    }
  });

  it('scrolls with finger-sized cells once fitting would make cells too small', () => {
    const v = viewFor(300, 600, 12);
    expect((300 / boardWidth(12)) * 100).toBeLessThan(MIN_FIT_CELL);
    expect(v).not.toBeNull();
    expect(v?.width).toBe(Math.round(boardWidth(12) * (SCROLL_CELL / 100)));
  });

  it('does not scroll when the height is what keeps the board small', () => {
    expect(viewFor(300, 150, 12)).toBeNull();
  });
});
