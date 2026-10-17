import type { Page } from '@playwright/test';
import { freshProgress } from '../src/state/store';
import { expect, test as it } from './fixtures';
import { progress } from './helpers';

const seed = (tokens: number) => JSON.stringify({ state: { progress: { ...freshProgress(), tokens } }, version: 2 });

async function open(page: Page, tokens: number) {
  await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), seed(tokens));
  await page.goto('/');
  await page.click('[data-go="gacha"]');
}

async function centre(page: Page, sel: string) {
  const b = await page.locator(sel).boundingBox();
  if (!b) throw new Error(`${sel} not visible`);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, r: Math.min(b.width, b.height) / 2 };
}

/** Turns the crank by dragging round it clockwise, `turns` times */
async function turnCrank(page: Page, turns: number) {
  const c = await centre(page, '#crank');
  const rr = c.r * 0.7;
  await page.mouse.move(c.x, c.y - rr);
  await page.mouse.down();
  for (let i = 1; i <= turns * 24; i++) {
    const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
    await page.mouse.move(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr);
  }
  await page.mouse.up();
}

it.describe('a gacha machine you work by hand', () => {
  it('holds one capsule per shisa still to collect', async ({ page }) => {
    await open(page, 0);
    // Traditional series: 10 shisa, 2 owned from the start
    await expect(page.locator('#machineBox .capsule')).toHaveCount(8);
    await page.click('[data-series="animal"]');
    await expect(page.locator('#machineBox .capsule')).toHaveCount(5);
  });

  it('takes a coin dragged into the slot, then drops a capsule after one turn of the crank', async ({ page }) => {
    await open(page, 1);
    const purse = await centre(page, '#purse');
    const slot = await centre(page, '#slot');
    await page.mouse.move(purse.x, purse.y);
    await page.mouse.down();
    await page.mouse.move(slot.x, slot.y, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('#turnBtn')).toBeVisible();
    // The coin is only spent once a capsule comes out
    expect((await progress(page)).tokens).toBe(1);
    await turnCrank(page, 1.1);
    await expect(page.locator('#outCap')).toBeVisible();
    await expect(page.locator('#machineBox .capsule')).toHaveCount(7);
    const p = await progress(page);
    expect(p.tokens).toBe(0);
    expect(p.owned).toHaveLength(3);
    await page.click('#outCap');
    await expect(page.locator('#modal[data-kind="reveal"]')).toBeVisible();
    // The capsule flies up from the machine's tray rather than just appearing
    await expect(page.locator('#capsule')).toHaveClass(/flyIn/);
  });

  it('refuses to turn without a coin', async ({ page }) => {
    await open(page, 1);
    await turnCrank(page, 1.2);
    await expect(page.locator('#outCap')).toHaveCount(0);
    await expect(page.locator('#coinBtn')).toBeVisible();
    expect((await progress(page)).tokens).toBe(1);
  });

  it('turns back only by slipping: winding the crank the wrong way drops nothing', async ({ page }) => {
    await open(page, 1);
    await page.click('#slot');
    const c = await centre(page, '#crank');
    const rr = c.r * 0.7;
    await page.mouse.move(c.x, c.y - rr);
    await page.mouse.down();
    for (let i = 1; i <= 30; i++) {
      const a = -Math.PI / 2 - (i / 24) * Math.PI * 2;
      await page.mouse.move(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr);
    }
    await page.mouse.up();
    await expect(page.locator('#outCap')).toHaveCount(0);
    expect((await progress(page)).tokens).toBe(1);
  });
});
