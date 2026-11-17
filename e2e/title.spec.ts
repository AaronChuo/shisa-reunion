import { type Page, test as plain } from '@playwright/test';
import { expect, test as it } from './fixtures';
import { progress } from './helpers';

const KEY = 'shisa-reunion';

/** A save with these progress fields, and the title screen kept (the fixture skips it otherwise) */
async function returning(page: Page, p: Record<string, unknown>) {
  await page.addInitScript(
    ([key, s]) => {
      (window as unknown as { keepTitle: boolean }).keepTitle = true;
      if (!localStorage.getItem(key)) localStorage.setItem(key, s);
    },
    [KEY, JSON.stringify({ state: { progress: p }, version: 2 })],
  );
}

const bgm = (page: Page) => page.evaluate(() => [document.documentElement.dataset.bgm, document.documentElement.dataset.queue]);

plain.describe('the title screen for a brand-new player', () => {
  plain('opens the game with 開始, which asks who is playing and then plays the story', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#home')).toHaveCount(0);
    await expect(page.locator('#titleGo')).toHaveText('開始');
    // Nothing is asked over the title screen
    await expect(page.locator('#modal')).toHaveCount(0);
    await page.click('#titleGo');
    await expect(page.locator('#title')).toHaveCount(0);
    await page.click('.ageCard[data-age="kid"]');
    await expect(page.locator('#story')).toBeVisible();
  });
});

it.describe('the title screen for a returning player', () => {
  it('says 繼續 with where the journey stands, then shows the map and stays away for the rest of the visit', async ({ page }) => {
    await returning(page, { seen: ['story'], age: 'kid', clears: { naha: 1 }, open: ['naha', 'chatan', 'yomitan'] });
    await page.goto('/');
    await expect(page.locator('#titleGo')).toHaveText('繼續');
    await expect(page.locator('.titleWhere')).toHaveText('下一站：美國村');
    await expect(page.locator('#story')).toHaveCount(0);
    await page.click('#titleGo');
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#modal')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#title')).toHaveCount(0);
  });

  it('plays the theme at the top of the queue, which carries on into the map', async ({ page }) => {
    await returning(page, { seen: ['story'], age: 'kid' });
    await page.goto('/');
    await page.click('.titleLogo');
    expect(await bgm(page)).toEqual(['theme', 'lobby']);
    await page.click('#titleGo');
    expect(await bgm(page)).toEqual(['theme', 'lobby']);
  });
});

it.describe('starting over', () => {
  it('clears this device’s progress after asking once more, keeps the sound switches, and goes back to the title', async ({ page }) => {
    await page.addInitScript(
      ([key, s]) => localStorage.getItem(key) || localStorage.setItem(key, s),
      [KEY, JSON.stringify({ state: { progress: { tokens: 7, age: 'big', music: false, clears: { naha: 2 } } }, version: 2 })],
    );
    await page.goto('/');
    await page.click('#audioBtn');
    await page.focus('#parentsBtn');
    await page.keyboard.press('Enter');
    await page.click('#startOverBtn');
    // Asked once more, with a way back and a backup a tap away
    await expect(page.locator('#modal h2')).toHaveText('從頭開始？');
    await expect(page.locator('#modal')).toContainText('福氣幣 7 枚');
    expect((await progress(page)).tokens).toBe(7);
    await page.click('#startOverYes');
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#titleGo')).toHaveText('開始');
    const p = await progress(page);
    expect(p.tokens).toBe(0);
    expect(p.clears.naha).toBe(0);
    expect(p.seen).toEqual([]);
    expect(p.age).toBeNull();
    expect(p.music).toBe(false);
    // The next player is asked who is playing
    await page.click('#titleGo');
    await expect(page.locator('#modal[data-kind="age"]')).toBeVisible();
  });

  it('keeps everything when the grown-up changes their mind', async ({ page }) => {
    await page.addInitScript(
      ([key, s]) => localStorage.getItem(key) || localStorage.setItem(key, s),
      [KEY, JSON.stringify({ state: { progress: { tokens: 3, age: 'big' } }, version: 2 })],
    );
    await page.goto('/');
    await page.click('#audioBtn');
    await page.focus('#parentsBtn');
    await page.keyboard.press('Enter');
    await page.click('#startOverBtn');
    await page.click('#modal .linkBtn');
    await expect(page.locator('#modal h2')).toHaveText('大人設定');
    expect((await progress(page)).tokens).toBe(3);
  });
});
