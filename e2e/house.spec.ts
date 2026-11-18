import type { Locator, Page } from '@playwright/test';
import { STARTERS, VARIANT_BY_ID } from '../src/content/shisa';
import { expect, test as it } from './fixtures';
import { progress } from './helpers';

const KEY = 'shisa-reunion';

/** A save with these progress fields (the fixture adds the story and postcards as seen) */
async function seed(page: Page, p: Record<string, unknown>) {
  await page.addInitScript(
    ([key, s]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, s);
    },
    [KEY, JSON.stringify({ state: { progress: p }, version: 2 })],
  );
}

/** Presses on the middle of `from` and lets go at a point of `to`, given as fractions of its box */
async function drag(page: Page, from: Locator, to: Locator, fx: number, fy: number) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error('not on screen');
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 10 });
  await page.mouse.up();
}

const house = async (page: Page) => (await progress(page)).house;

it.describe('西薩的家', () => {
  it('opens from the map with the pair on the roof and the three decorations every house starts with', async ({ page }) => {
    await seed(page, { owned: [...STARTERS, 'gold'] });
    await page.goto('/');
    await page.click('[data-go="house"]');
    await expect(page.locator('#house')).toBeVisible();
    await expect(page.locator('.hStk.roof[data-roof="0"]')).toHaveAttribute('aria-label', VARIANT_BY_ID[STARTERS[0]].name);
    await expect(page.locator('.hStk.roof[data-roof="1"]')).toHaveAttribute('aria-label', VARIANT_BY_ID[STARTERS[1]].name);
    await expect(page.locator('#houseTiles .hTile:not(.locked)')).toHaveCount(3);
    // Every shisa pulled can come too; the two on the roof are already up there
    await page.click('#htab-shisa');
    await expect(page.locator('#houseTiles .hTile')).toHaveCount(3);
    await expect(page.locator('#houseTiles .hTile.roof')).toHaveCount(2);
    await page.click('[data-go="home"]');
    await expect(page.locator('#home')).toBeVisible();
  });

  it('puts a tapped decoration in the yard once, and it is still there after a reload', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="house"]');
    await page.click('.hTile[data-id="hibiscus"]');
    await expect(page.locator('.hStk[data-id="hibiscus"]')).toHaveCount(1);
    await expect(page.locator('#houseCount')).toHaveText('1');
    // One of each: tapping it again only makes the one in the yard hop
    await page.click('.hTile[data-id="hibiscus"]');
    await expect(page.locator('.hStk[data-id="hibiscus"]')).toHaveCount(1);
    await expect(page.locator('.hTile[data-id="hibiscus"]')).toHaveClass(/home/);
    await page.reload();
    await page.click('[data-go="house"]');
    await expect(page.locator('.hStk[data-id="hibiscus"]')).toHaveCount(1);
    expect((await house(page)).placed.map((s) => s.id)).toEqual(['hibiscus']);
  });

  it('puts a shisa where it is dropped, moves it, and puts it away when dragged back into the drawer', async ({ page }) => {
    await seed(page, { owned: [...STARTERS, 'gold'] });
    await page.goto('/');
    await page.click('[data-go="house"]');
    await page.click('#htab-shisa');
    const scene = page.locator('#houseScene');
    await drag(page, page.locator('.hTile[data-id="gold"]'), scene, 0.25, 0.8);
    await expect(page.locator('.hStk[data-id="gold"]')).toHaveCount(1);
    let [s] = (await house(page)).placed;
    expect(s.id).toBe('gold');
    expect(Math.abs(s.x - 90)).toBeLessThan(8);
    expect(s.y).toBeGreaterThan(360);

    await drag(page, page.locator('.hStk[data-id="gold"]'), scene, 0.75, 0.85);
    [s] = (await house(page)).placed;
    expect(Math.abs(s.x - 270)).toBeLessThan(30);

    await drag(page, page.locator('.hStk[data-id="gold"]'), page.locator('#houseDrawer'), 0.5, 0.5);
    await expect(page.locator('.hStk[data-id="gold"]')).toHaveCount(0);
    expect((await house(page)).placed).toEqual([]);
  });

  it('shows the decorations still to come as shadows that say where they come from, and moves each its own way', async ({ page }) => {
    await seed(page, { decor: ['lantern'] });
    await page.goto('/');
    await page.click('[data-go="house"]');
    // The three every house starts with and the lantern first, then 55 shadows
    await expect(page.locator('#houseTiles .hTile:not(.locked)')).toHaveCount(4);
    await expect(page.locator('#houseTiles .hTile.locked')).toHaveCount(55);
    await page.click('.hTile[data-id="cat"]');
    await expect(page.locator('.hHint')).toHaveText('動物系列的西薩收齊後，扭蛋機會升級，就轉得到貓');
    await expect(page.locator('.hStk[data-id="cat"]')).toHaveCount(0);
    // A lantern swings from the top when it lands
    await page.click('.hTile[data-id="lantern"]');
    await expect(page.locator('.hStk[data-id="lantern"] .hIn')).toHaveClass(/m-swing/);
  });

  it('stands in front of the picture of a zone that has been visited', async ({ page }) => {
    await seed(page, { clears: { naha: 1 } });
    await page.goto('/');
    await page.click('[data-go="house"]');
    await page.click('#htab-bd');
    await page.click('.hTile[data-bd="naha"]');
    await expect(page.locator('#houseScene')).toHaveAttribute('data-bd', 'naha');
    await expect(page.locator('#houseScene img.hBd')).toHaveAttribute('src', '/scenes/naha/day.webp');
    expect((await house(page)).bd).toBe('naha');
  });

  it('sends a shisa in the yard up onto the roof when it joins the pair', async ({ page }) => {
    await seed(page, { owned: [...STARTERS, 'gold'], house: { bd: 'sky', placed: [{ id: 'gold', x: 100, y: 400 }] } });
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('.dexTile[data-pick="gold"]');
    await page.click('#modal [data-role="0"]');
    await page.click('[data-go="home"]');
    await page.click('[data-go="house"]');
    await expect(page.locator('.hStk[data-id="gold"]')).toHaveCount(0);
    await expect(page.locator('.hStk.roof[data-roof="0"]')).toHaveAttribute('aria-label', VARIANT_BY_ID.gold.name);
    expect((await house(page)).placed).toEqual([]);
  });
});
