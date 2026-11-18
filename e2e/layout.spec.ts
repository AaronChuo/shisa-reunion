import type { Page } from '@playwright/test';
import { expect, test as it } from './fixtures';
import { waitForLevel } from './helpers';

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => {
    const s = document.querySelector('.screen');
    return !!s && s.scrollWidth <= s.clientWidth + 1;
  });

it.describe('phone layout', () => {
  it('keeps a long press from selecting text or opening the browser menu', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('h1');
    expect(await title.evaluate((el) => getComputedStyle(el).userSelect)).toBe('none');
    // The long-press menu starts as a contextmenu event, which the game cancels
    const cancelled = await title.evaluate((el) => !el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
    expect(cancelled).toBe(true);
  });

  it('shows the big go button without scrolling', async ({ page }) => {
    await page.goto('/');
    const bb = await page.locator('#goBtn').boundingBox();
    const vh = page.viewportSize()?.height ?? 0;
    expect(bb && bb.y + bb.height).toBeLessThanOrEqual(vh);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  it('keeps every gacha series tab tappable and clear of the machine', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="gacha"]');
    const blocked = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-series]')]
        .filter((b) => {
          const r = b.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit?.closest('[data-series]') !== b;
        })
        .map((b) => b.dataset.series),
    );
    expect(blocked).toEqual([]);
    for (const id of ['food', 'fest']) {
      await page.locator(`[data-series="${id}"]`).tap();
      await expect(page.locator(`[data-series="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    }
    const overlaps = await page.evaluate(() => {
      const m = document.querySelector('.machine')?.getBoundingClientRect();
      if (!m) return ['no machine'];
      return [...document.querySelectorAll('.gPanel > *, .series')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.left < m.right && r.right > m.left && r.top < m.bottom && r.bottom > m.top;
        })
        .map((el) => el.className || el.tagName);
    });
    expect(overlaps).toEqual([]);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  it('picks a zone on the map, with the go card kept on screen and nothing laid over a pin', async ({ page }) => {
    await page.goto('/');
    // No list of zones on a phone: the map is where a zone is picked
    await expect(page.locator('.zone').first()).toBeHidden();
    const vh = page.viewportSize()?.height ?? 0;
    const card = page.locator('#goCard');
    const onScreen = async () => {
      const bb = await card.boundingBox();
      return !!bb && bb.y >= 0 && bb.y + bb.height <= vh;
    };
    expect(await onScreen()).toBe(true);
    const covered = await page.evaluate(() =>
      [...document.querySelectorAll<SVGGElement>('.islandWrap [data-zone]')]
        .filter((g) => {
          g.scrollIntoView({ block: 'center' });
          const r = g.querySelectorAll('circle')[1]?.getBoundingClientRect();
          if (!r) return true;
          return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-zone]') !== g;
        })
        .map((g) => g.dataset.zone),
    );
    expect(covered).toEqual([]);
    await page.locator('.islandWrap [data-zone="1"]').tap();
    await expect(card).toContainText('美國村');
    await expect(page.locator('#goBtn')).toBeDisabled();
    expect(await onScreen()).toBe(true);
    await page.locator('.islandWrap [data-zone="0"]').tap();
    await expect(page.locator('#goBtn')).toBeEnabled();
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  it('fits 西薩的家 and its drawer on one screen, and a tap puts a decoration in the yard', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="house"]');
    const vh = page.viewportSize()?.height ?? 0;
    const scene = await page.locator('#houseScene').boundingBox();
    const drawer = await page.locator('#houseDrawer').boundingBox();
    expect(scene && drawer).toBeTruthy();
    if (!scene || !drawer) return;
    expect(drawer.y + drawer.height).toBeLessThanOrEqual(vh);
    expect(scene.y + scene.height).toBeLessThanOrEqual(drawer.y);
    // The house keeps its shape and gets most of a phone's width
    expect(Math.abs(scene.width / scene.height - 0.8)).toBeLessThan(0.02);
    expect(scene.width).toBeGreaterThan(200);
    await page.locator('.hTile[data-id="jar"]').tap();
    await expect(page.locator('.hStk[data-id="jar"]')).toHaveCount(1);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  it('fits the zone name and the tray on the play screen', async ({ page }) => {
    await page.goto('/');
    await page.click('#goBtn');
    await waitForLevel(page);
    const clipped = await page.evaluate(() => {
      const z = document.getElementById('zoneName');
      return !z || z.scrollWidth > z.clientWidth;
    });
    expect(clipped).toBe(false);
    await expect(page.locator('.tray .card').first()).toBeInViewport();
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  it('marks a picked tray block with its own border only, no focus ring around it', async ({ page }) => {
    await page.goto('/');
    await page.click('#goBtn');
    await waitForLevel(page);
    const card = page.locator('.tray .card').first();
    // Picked by keyboard, the strictest case: the browser would draw its focus ring here
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveClass(/\bsel\b/);
    expect(await card.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
  });
});
