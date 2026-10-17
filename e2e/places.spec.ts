import { expect, test as it, type Page } from '@playwright/test';
import { freshProgress } from '../src/state/store';
import { progress } from './helpers';

// Plain Playwright: the postcards show as they do for a new player (only the opening story is marked as seen)
async function open(page: Page, extra: Record<string, unknown> = {}) {
  const save = JSON.stringify({ state: { progress: { ...freshProgress(), seen: ['story'], ...extra } }, version: 2 });
  await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), save);
  await page.goto('/');
}

it.describe('place postcards', () => {
  it('shows the Naha postcard on the first trip there, then carries on to the new-block card', async ({ page }) => {
    await open(page);
    await page.click('#goBtn');
    await expect(page.locator('#modal[data-kind="place"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#modal .tale p')).toContainText('國際通');
    await page.click('#modal [data-ok]');
    await expect(page.locator('#modal[data-kind="intro"]')).toBeVisible();
    expect((await progress(page)).seen).toContain('place:naha');
  });

  it('opens a postcard from a map pin, with a button that sets off for that place', async ({ page }) => {
    await open(page);
    await page.click('.islandWrap [data-zone="0"]');
    await expect(page.locator('#modal[data-kind="place"] h2')).toHaveText('那霸港');
    await page.click('#modal [data-go-place]');
    await expect.poll(async () => (await progress(page)).run?.zone).toBe('naha');
  });

  it('lets a locked place be read about without setting off or collecting it', async ({ page }) => {
    await open(page);
    await page.click('.islandWrap [data-zone="6"]');
    await expect(page.locator('#modal')).toContainText('先走完西表島');
    await expect(page.locator('#modal [data-go-place]')).toHaveCount(0);
    expect((await progress(page)).seen).not.toContain('place:shuri');
  });

  it('has a postcard for Okinawa itself and collects postcards in the collection', async ({ page }) => {
    await open(page);
    await page.click('#okinawaBtn');
    await expect(page.locator('#modal')).toContainText('琉球王國');
    await page.click('#modal [data-ok]');
    await page.click('[data-go="dex"]');
    await expect(page.locator('.pcTile:not(.locked)')).toHaveCount(1);
    await expect(page.locator('.pcTile.locked')).toHaveCount(7);
  });
});
