import { expect, test as it, type Page } from '@playwright/test';
import { freshProgress } from '../src/state/store';
import { progress } from './helpers';

// Plain Playwright: the postcards show as they do for a new player (only the opening story is marked as seen, and who is playing is set)
async function open(page: Page, extra: Record<string, unknown> = {}) {
  const save = JSON.stringify({ state: { progress: { ...freshProgress(), seen: ['story'], age: 'little', ...extra } }, version: 2 });
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
    await expect(page.locator('#modal[data-kind="place"] h2')).toHaveText('那霸市');
    await page.click('#modal [data-go-place]');
    await expect.poll(async () => (await progress(page)).run?.zone).toBe('naha');
  });

  it('lets a locked place be read about without setting off or collecting it', async ({ page }) => {
    await open(page);
    // Shuri (大師) opens once two 高手 zones are finished
    await page.click('.islandWrap [data-zone="8"]');
    await expect(page.locator('#modal')).toContainText('走完 2 個高手地區才會打開');
    await expect(page.locator('#modal [data-go-place]')).toHaveCount(0);
    expect((await progress(page)).seen).not.toContain('place:shuri');
  });

  it('keeps every map pin tappable, nothing laid over them', async ({ page }) => {
    await open(page, { open: ['naha', 'yomitan', 'motobu', 'kouri', 'nakagusuku', 'taketomi', 'iriomote', 'miyako', 'shuri', 'kumejima'] });
    const covered = await page.evaluate(() =>
      [...document.querySelectorAll<SVGGElement>('.islandWrap [data-zone]')]
        .filter((g) => {
          const r = g.querySelector('circle')?.getBoundingClientRect();
          if (!r) return true;
          return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-zone]') !== g;
        })
        .map((g) => g.dataset.zone),
    );
    expect(covered).toEqual([]);
    const btn = await page.locator('#okinawaBtn').boundingBox();
    expect(btn?.height).toBeLessThan(70);
  });

  it('has a postcard for Okinawa itself and collects postcards in the collection', async ({ page }) => {
    await open(page);
    await page.click('#okinawaBtn');
    await expect(page.locator('#modal')).toContainText('琉球王國');
    // A real photo, with its author and licence credited under it
    await expect.poll(() => page.locator('#modal img.postcardArt').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('#modal .photoCredit')).toContainText('CC BY');
    await page.click('#modal [data-ok]');
    await page.click('[data-go="dex"]');
    // Postcards have their own page; the collection opens on the shisa
    await expect(page.locator('#page-shisa')).toBeVisible();
    await expect(page.locator('.pcTile')).toHaveCount(0);
    await page.click('#tab-cards');
    await expect(page.locator('.pcTile:not(.locked)')).toHaveCount(1);
    await expect(page.locator('.pcTile.locked')).toHaveCount(10);
    // Thumbnails keep the postcard's shape
    const tile = await page.locator('.pcTile[data-place="okinawa"] img').boundingBox();
    expect(tile && tile.width / tile.height).toBeCloseTo(5 / 3, 1);
    await page.click('#creditsBtn');
    await expect(page.locator('#modal .creditList li')).toHaveCount(11);
    // The narration is synthesized, and says so
    await expect(page.locator('#voiceCredit')).toContainText('Azure');
    // Leaving and coming back finds the same page
    await page.click('#modal [data-ok]');
    await page.click('[data-go="home"]');
    await page.click('[data-go="dex"]');
    await expect(page.locator('#page-cards')).toBeVisible();
  });
});
