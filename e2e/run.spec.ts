import { expect, test as it } from './fixtures';
import { dismissIntros, progress, solveByDragging, waitForLevel } from './helpers';

it.describe('a full journey', () => {
  it('clears all five stops of Naha by dragging blocks, then pulls a new shisa', async ({ page }) => {
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
    // The main button walks through the machine: coin in, one turn of the crank, open what rolled out
    await page.locator('#coinBtn').click();
    await page.locator('#turnBtn').click();
    await page.locator('#openBtn').click();
    await page.locator('#capsule').click();
    // One tap sends the new shisa out as the one that sets out; no second question
    await page.locator('#modal [data-use]').click();
    await expect(page.locator('#modal')).toHaveCount(0);
    p = await progress(page);
    expect(p.tokens).toBe(4);
    expect(p.owned).toHaveLength(3);
    expect(p.pair[0]).toBe(p.owned[2]);
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
