import { expect, test as it, type Page } from '@playwright/test';
import { progress, waitForLevel } from './helpers';

// These tests use the plain Playwright test, so the game opens as it does for a brand-new player
const next = (page: Page) => page.click('#storyNext');

it.describe('the opening story', () => {
  // A brand-new player, except that a grown-up has already said who is playing (asked on the map otherwise)
  it.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('shisa-reunion')) localStorage.setItem('shisa-reunion', JSON.stringify({ state: { progress: { age: 'little' } }, version: 2 }));
    });
  });

  it('opens the first time and teaches the name before setting off on the first stop', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#story')).toBeVisible();
    // Page 1 waits until a shisa has been tapped, which says its name
    await expect(page.locator('#storyNext')).toBeDisabled();
    await page.click('#story [data-shisa="0"]');
    await expect(page.locator('#story .storyBubble')).toContainText('我是西薩！');
    await expect(page.locator('#story .nameTag')).toContainText('西薩');
    await next(page);
    await expect(page.locator('#story')).toHaveAttribute('data-page', 'pair');
    await next(page);
    // The typhoon page waits for a swipe across the picture
    await expect(page.locator('#storyNext')).toBeDisabled();
    const box = await page.locator('#story .storyScene').boundingBox();
    if (!box) throw new Error('no scene');
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('#story .storyText')).toContainText('吹散');
    await next(page);
    await next(page);
    await page.click('#storyGo');
    await expect(page.locator('#story')).toHaveCount(0);
    await waitForLevel(page);
    const p = await progress(page);
    expect(p.seen).toContain('story');
    expect(p.run?.zone).toBe('naha');
  });

  it('can be skipped, stays away after that, and plays again from the map', async ({ page }) => {
    await page.goto('/');
    await page.click('#skipStory');
    await expect(page.locator('#story')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#story')).toHaveCount(0);
    await page.click('#storyBtn');
    await expect(page.locator('#story')).toBeVisible();
  });
});
