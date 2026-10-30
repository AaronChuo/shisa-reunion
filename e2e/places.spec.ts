import { expect, test as it, type Page } from '@playwright/test';
import { CARD_TOTAL } from '../src/content/places';
import { relax, stageCfg, ZONES } from '../src/content/zones';
import { generate } from '../src/engine';
import { freshProgress } from '../src/state/store';
import { dismissIntros, progress, solveByDragging, waitForLevel } from './helpers';

// Plain Playwright: the postcards show as they do for a new player (only the opening story is marked as seen, and who is playing is set)
async function open(page: Page, extra: Record<string, unknown> = {}) {
  const save = JSON.stringify({ state: { progress: { ...freshProgress(), seen: ['story'], age: 'little', ...extra } }, version: 2 });
  await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), save);
  await page.goto('/');
}

it.describe('place postcards', () => {
  it('shows Naha’s first card on the first trip there, and collects it once the first stop is cleared', async ({ page }) => {
    await open(page);
    await page.click('#goBtn');
    await expect(page.locator('#modal[data-kind="place"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#modal h2')).toHaveText('國際通');
    await expect(page.locator('#modal .tale p')).toContainText('國際通');
    // Not yet earned: its slot says what earns it
    await expect(page.locator('#modal [data-card-slot="1"]')).toContainText('過第一站');
    await page.click('#modal [data-ok]');
    await expect(page.locator('#modal[data-kind="intro"]')).toBeVisible();
    expect((await progress(page)).seen).not.toContain('place:naha');
    await solveByDragging(page, await waitForLevel(page));
    await expect(page.locator('#modal[data-kind="win"] [data-new-card="naha:1"]')).toContainText('國際通');
    expect((await progress(page)).seen).toContain('place:naha');
  });

  it('brings a zone’s second card with its second journey', async ({ page }) => {
    // Naha's last stop, on the way to finishing it a second time
    const level = generate(stageCfg(0, 4, []), 5, relax);
    const run = {
      zone: 'naha',
      zi: 0,
      si: 4,
      seed: 5,
      plan: [[], [], [], [], []],
      level,
      placed: [],
      moves: 0,
      hist: [],
      orient: level.inv.map(() => 0),
      shell: 2,
      conch: 1,
      earned: 4,
      rerolls: 0,
      phase: 'play',
    };
    await open(page, {
      seen: ['story', 'place:naha', 'coach', 'stair', 'cube', 'tower', 'bridge', 'bar'],
      clears: { naha: 1 },
      open: ['naha', 'chatan', 'yomitan'],
      run,
    });
    await page.click('[data-resume]');
    await dismissIntros(page);
    await solveByDragging(page, level);
    await page.locator('#modal[data-kind="win"] [data-next]').click();
    await expect(page.locator('#modal[data-kind="done"] [data-new-card="naha:2"]')).toContainText('波上宮');
    await page.click('#modal [data-h]');
    // From the map pin, the newest card shows first; the first can be turned to, the third says what earns it
    await page.click('.islandWrap [data-zone="0"]');
    const art = page.locator('#modal img.postcardArt');
    await expect(art).toHaveAttribute('src', '/postcards/naha/2.webp');
    await expect.poll(() => art.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('#modal [data-card-slot="3"]')).toContainText('走完 3 次');
    await page.click('#modal [data-card-slot="1"]');
    await expect(page.locator('#modal h2')).toHaveText('國際通');
    await expect(art).toHaveAttribute('src', '/postcards/naha/1.webp');
  });

  it('opens a postcard from a map pin, with a button that sets off for that place', async ({ page }) => {
    await open(page);
    await page.click('.islandWrap [data-zone="0"]');
    await expect(page.locator('#modal[data-kind="place"] .eyebrow')).toHaveText('那霸市');
    await expect(page.locator('#modal[data-kind="place"] h2')).toHaveText('國際通');
    await page.click('#modal [data-go-place]');
    await expect.poll(async () => (await progress(page)).run?.zone).toBe('naha');
  });

  it('lets a locked place be read about without setting off or collecting it', async ({ page }) => {
    await open(page);
    // Shuri (大師) opens once three of the four 高手 zones are finished
    await page.click(`.islandWrap [data-zone="${ZONES.findIndex((z) => z.id === 'shuri')}"]`);
    await expect(page.locator('#modal')).toContainText('走完 3 個高手地區才會打開');
    await expect(page.locator('#modal [data-go-place]')).toHaveCount(0);
    expect((await progress(page)).seen).not.toContain('place:shuri');
  });

  it('keeps every map pin tappable, nothing laid over them', async ({ page }) => {
    await open(page, { open: ZONES.map((z) => z.id) });
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
    // Okinawa's card is a drawn map, and has no row of other cards
    await expect(page.locator('#modal svg.postcardArt')).toBeVisible();
    await expect(page.locator('#modal .cardStrip')).toHaveCount(0);
    await page.click('#modal [data-ok]');
    await page.click('[data-go="dex"]');
    // Postcards have their own page; the collection opens on the shisa
    await expect(page.locator('#page-shisa')).toBeVisible();
    await expect(page.locator('.pcTile')).toHaveCount(0);
    await page.click('#tab-cards');
    await expect(page.locator('.pcTile:not(.locked)')).toHaveCount(1);
    await expect(page.locator('.pcTile.locked')).toHaveCount(CARD_TOTAL - 1);
    await expect(page.locator('#page-cards [data-place="onna"] .pcTile.locked')).toHaveText(['過第一站', '走完 2 次', '走完 3 次']);
    // Thumbnails keep the postcard's shape
    const tile = await page.locator('.pcTile[data-card="okinawa:1"] svg').boundingBox();
    expect(tile && tile.width / tile.height).toBeCloseTo(5 / 3, 1);
    await page.click('#creditsBtn');
    // All the pictures are drawn for the game, so there are no photo credits
    await expect(page.locator('#modal')).toContainText('原創插畫');
    // The narration is synthesized, and says so
    await expect(page.locator('#voiceCredit')).toContainText('Azure');
    // Leaving and coming back finds the same page
    await page.click('#modal [data-ok]');
    await page.click('[data-go="home"]');
    await page.click('[data-go="dex"]');
    await expect(page.locator('#page-cards')).toBeVisible();
  });
});
