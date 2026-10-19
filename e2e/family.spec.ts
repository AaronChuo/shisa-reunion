import type { Page } from '@playwright/test';
import { expect, test as it } from './fixtures';
import { progress } from './helpers';

const KEY = 'shisa-reunion';

/** A save with these progress fields; anything left out is filled in as for a new player */
const seed = (page: Page, p: Record<string, unknown>) =>
  page.addInitScript(([key, s]) => localStorage.getItem(key) || localStorage.setItem(key, s), [KEY, JSON.stringify({ state: { progress: p }, version: 2 })]);

it.describe('who is playing', () => {
  it('asks a grown-up once on the map, and remembers the answer', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { keepAgeUnset: boolean }).keepAgeUnset = true;
    });
    await seed(page, { age: null });
    await page.goto('/');
    const ask = page.locator('#modal[data-kind="age"]');
    await expect(ask).toBeVisible();
    await page.click('.ageCard[data-age="big"]');
    await expect(ask).toHaveCount(0);
    const p = await progress(page);
    expect(p.age).toBe('big');
    expect(p.restMin).toBeNull();
    await page.reload();
    await expect(page.locator('#goBtn')).toBeVisible();
    await expect(ask).toHaveCount(0);
  });

  it('shows older players no pointing finger', async ({ page }) => {
    await page.clock.install();
    await seed(page, { age: 'big' });
    await page.goto('/');
    await page.clock.fastForward(20_000);
    await expect(page.locator('#goBtn .tapHand')).toHaveCount(0);
  });
});

it.describe("grown-ups' settings", () => {
  it('open only when the button is held, not on a tap', async ({ page }) => {
    await page.goto('/');
    await page.click('#audioBtn');
    await page.click('#parentsBtn');
    await expect(page.locator('#modal[data-kind="parents"]')).toHaveCount(0);
    const b = await page.locator('#parentsBtn').boundingBox();
    if (!b) throw new Error('no grown-ups button');
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect(page.locator('#modal[data-kind="parents"]')).toBeVisible({ timeout: 3000 });
    await page.mouse.up();
    await page.click('#modal .ageCard[data-age="kid"]');
    expect((await progress(page)).age).toBe('kid');
    // The rest reminder follows the age, and can then be changed
    expect((await progress(page)).restMin).toBe(30);
    await page.click('.chip[data-rest="45"]');
    expect((await progress(page)).restMin).toBe(45);
  });

  it('remind the child to rest at a break once the chosen time has passed', async ({ page }) => {
    await page.clock.install();
    await seed(page, { age: 'little', restMin: 15 });
    await page.goto('/');
    await expect(page.locator('#goBtn')).toBeVisible();
    await page.clock.fastForward('14:00');
    await expect(page.locator('#modal')).toHaveCount(0);
    await page.clock.fastForward('01:10');
    const rest = page.locator('#modal[data-kind="rest"]');
    await expect(rest).toBeVisible();
    await rest.locator('.cta').click();
    await expect(page.locator('#modal')).toHaveCount(0);
  });
});
