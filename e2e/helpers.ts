import { expect, type Page } from '@playwright/test';
import { DEFS, type Level, sizeOf, solve } from '../src/engine';
import type { Progress } from '../src/state/store';

const C = 100;
const M = 40;
const Y0 = 640;

export async function progress(page: Page): Promise<Progress> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('shisa-reunion') ?? '{}').state.progress);
}

/** Clicks through any "new piece / new mechanism" cards */
export async function dismissIntros(page: Page): Promise<void> {
  for (let n = 0; n < 6; n++) {
    const ok = page.locator('#modal[data-kind="intro"] [data-ok]');
    if (!(await ok.isVisible())) return;
    await ok.click();
  }
}

/** Waits until the current stage's level has been generated and is on screen */
export async function waitForLevel(page: Page): Promise<Level> {
  await expect
    .poll(async () => {
      const p = await progress(page);
      const loading = await page.locator('#modal[data-kind="loading"]').count();
      return p.run?.phase === 'play' && !!p.run.level && !loading;
    })
    .toBe(true);
  await dismissIntros(page);
  const p = await progress(page);
  if (!p.run?.level) throw new Error('no level');
  return p.run.level;
}

/** Solves the level with the engine and builds the solution by dragging tray cards onto the board */
export async function solveByDragging(page: Page, lv: Level): Promise<void> {
  const [sol] = solve(lv, 1).sols;
  const used = new Set<number>();
  // A hint (or the first-stage demonstration) may already have turned a card, so turn from where it is now
  const orient = (await progress(page)).run?.orient ?? [];
  for (const p of sol) {
    const k = lv.inv.findIndex((t, i) => t === p.t && !used.has(i));
    used.add(k);
    const n = DEFS[p.t].orients.length;
    const turns = (p.o - (orient[k] ?? 0) + n) % n;
    for (let r = 0; r < turns; r++) await page.click(`.card[data-k="${k}"] .rot`);
    const card = page.locator(`.card[data-k="${k}"]`);
    const bb = await card.boundingBox();
    if (!bb) throw new Error('card not visible');
    const { w, h } = sizeOf(p.t, p.o);
    const target = await page.evaluate(
      ([sx, sy]) => {
        const b = document.getElementById('board') as unknown as SVGSVGElement;
        const ctm = b.getScreenCTM();
        if (!ctm) throw new Error('no board');
        const q = new DOMPoint(sx, sy).matrixTransform(ctm);
        return { x: q.x, y: q.y };
      },
      [M + (p.x + w / 2) * C, Y0 - (p.y + h / 2) * C],
    );
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x, target.y, { steps: 8 });
    await page.mouse.up();
  }
}
