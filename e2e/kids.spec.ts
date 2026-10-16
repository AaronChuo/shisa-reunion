import { expect, test as it } from '@playwright/test';
import { progress, solveByDragging, waitForLevel } from './helpers';

// For children who can't read yet: one big button to press, pictures, and a finger that shows what to do
it.describe('playing without reading', () => {
  it('offers exactly one main button on the map and it starts the first zone', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home .cta')).toHaveCount(1);
    await page.click('#goBtn');
    const lv = await waitForLevel(page);
    expect((await progress(page)).run?.zone).toBe('naha');
    expect(lv.inv.length).toBeGreaterThan(0);
  });

  it('points a finger at the main button when the child sits still', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await expect(page.locator('#goBtn .tapHand')).toHaveCount(0);
    await page.clock.fastForward(6000);
    await expect(page.locator('#goBtn .tapHand')).toBeVisible();
  });

  it('acts out the first drag with a finger and stops once the block is placed', async ({ page }) => {
    await page.goto('/');
    await page.click('#goBtn');
    const lv = await waitForLevel(page);
    await expect(page.locator('.dragDemo')).toBeVisible();
    // The demonstration is free: the hint shells are untouched
    expect((await progress(page)).run?.shell).toBe(2);
    await solveByDragging(page, lv);
    await expect(page.locator('.dragDemo')).toHaveCount(0);
  });

  it('turns the gacha button into "go play" when there are no coins', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="gacha"]');
    await expect(page.locator('#coinBtn')).toHaveCount(0);
    await page.click('#playBtn');
    await expect(page.locator('#home')).toBeVisible();
  });

  it('shows the two jobs as open and closed mouths in the collection', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('[data-pick="celadon"]');
    await expect(page.locator('#modal .roleCard')).toHaveCount(2);
    await page.click('#modal [data-role="0"]');
    expect((await progress(page)).pair).toEqual(['celadon', 'terracotta']);
  });
});
