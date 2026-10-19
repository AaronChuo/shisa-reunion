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

  it('fits the zone name and the tray on the play screen', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
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
    await page.click('.zone [data-zone="0"]');
    await waitForLevel(page);
    const card = page.locator('.tray .card').first();
    // Picked by keyboard, the strictest case: the browser would draw its focus ring here
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveClass(/\bsel\b/);
    expect(await card.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
  });
});
