import type { Page } from '@playwright/test';
import { expect, test as it } from './fixtures';
import { waitForLevel } from './helpers';

// Counts notes and drum hits by watching AudioBufferSourceNode.start / OscillatorNode.start
async function countSounds(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __sounds: number };
    w.__sounds = 0;
    type Startable = { start: (...a: unknown[]) => void };
    for (const proto of [AudioBufferSourceNode.prototype, OscillatorNode.prototype] as unknown as Startable[]) {
      const start = proto.start;
      proto.start = function (this: unknown, ...args: unknown[]) {
        w.__sounds += 1;
        return start.apply(this, args);
      };
    }
  });
}
const sounds = (page: Page) => page.evaluate(() => (window as unknown as { __sounds: number }).__sounds);
const bgm = (page: Page) => page.evaluate(() => document.documentElement.dataset.bgm);
const queue = (page: Page) => page.evaluate(() => document.documentElement.dataset.queue);

it.describe('sound', () => {
  it('starts the map music after the first tap and stops it when music is switched off', async ({ page }) => {
    await countSounds(page);
    await page.goto('/');
    await page.click('h1');
    expect(await bgm(page)).toBe('theme');
    await expect.poll(() => sounds(page)).toBeGreaterThan(3);

    await page.click('#audioBtn');
    await page.click('#musicSwitch');
    await expect(page.locator('#musicSwitch')).toHaveAttribute('aria-checked', 'false');
    await page.waitForTimeout(300);
    const before = await sounds(page);
    await page.waitForTimeout(1500);
    expect(await sounds(page)).toBe(before);
  });

  it('keeps one queue going across the map, the gacha and the collection, and plays the zone song on a journey', async ({ page }) => {
    await page.goto('/');
    expect(await bgm(page)).toBe('theme');
    expect(await queue(page)).toBe('lobby');
    await page.click('[data-go="gacha"]');
    expect(await bgm(page)).toBe('theme');
    await page.click('[data-go="dex"]');
    expect(await bgm(page)).toBe('theme');
    await page.click('[data-go="home"]');
    await page.click('.zone [data-zone="0"]');
    await waitForLevel(page);
    expect(await bgm(page)).toBe('tensagu');
    expect(await queue(page)).toBe('');
    // Back from the journey, the queue picks up at the song it was on
    await page.click('#toHome');
    expect(await bgm(page)).toBe('theme');
    expect(await queue(page)).toBe('lobby');
  });

  it('plays a sanshin note when a block is placed', async ({ page }) => {
    await countSounds(page);
    await page.goto('/');
    await page.click('#audioBtn');
    await page.click('#musicSwitch');
    await page.click('#modal [data-focus]');
    await page.click('.zone [data-zone="0"]');
    const lv = await waitForLevel(page);
    const before = await sounds(page);
    const card = page.locator('.card').first();
    const bb = await card.boundingBox();
    const board = await page.locator('#board').boundingBox();
    if (!bb || !board) throw new Error('missing layout');
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(board.x + board.width / 2, board.y + board.height * 0.8, { steps: 6 });
    await page.mouse.up();
    expect(lv.inv.length).toBeGreaterThan(0);
    await expect.poll(() => sounds(page)).toBeGreaterThan(before);
  });
});
