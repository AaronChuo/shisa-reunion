import { expect, test as it } from '@playwright/test';
import { dismissIntros, progress, solveByDragging, waitForLevel } from './helpers';

it.describe('a full journey', () => {
  it('clears all five stops of Naha port by dragging blocks, then pulls a new shisa', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    for (let si = 0; si < 5; si++) {
      const lv = await waitForLevel(page);
      await solveByDragging(page, lv);
      await page.locator('#modal[data-kind="win"] [data-next]').click();
      if (si < 4) await page.locator('#modal[data-kind="branch"] [data-card]').first().click();
    }
    await expect(page.locator('#modal[data-kind="done"]')).toBeVisible();
    let p = await progress(page);
    expect(p.tokens).toBe(5);
    expect(p.open).toEqual(['naha', 'yomitan']);
    expect(p.run).toBeNull();

    await page.locator('#modal [data-g]').click();
    await page.locator('#pullBtn').click();
    await page.locator('#capsule').click();
    await page.locator('#modal [data-use]').click();
    await page.locator('#modal [data-role="1"]').click();
    p = await progress(page);
    expect(p.tokens).toBe(4);
    expect(p.owned).toHaveLength(3);
    expect(p.pair[1]).toBe(p.owned[2]);
  });

  it('keeps an unfinished journey so it can be resumed after leaving', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    await waitForLevel(page);
    await page.click('#toHome');
    await expect(page.locator('[data-resume]')).toBeVisible();
    await page.reload();
    await page.click('[data-resume]');
    await dismissIntros(page);
    await expect(page.locator('#board #hero')).toBeVisible();
  });
});
