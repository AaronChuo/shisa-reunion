import { expect, test as it } from './fixtures';
import { animationOf, dismissIntros, progress, solveByDragging, waitForLevel } from './helpers';

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
    expect(p.open).toEqual(['naha', 'chatan', 'yomitan']);
    expect(p.run).toBeNull();

    await page.locator('#modal [data-g]').click();
    // The main button walks through the machine: coin in, one turn of the crank, open what rolled out
    await page.locator('#coinBtn').click();
    await page.locator('#turnBtn').click();
    await page.locator('#openBtn').click();
    await page.locator('#capsule').click();
    // One tap on the picture of the pair with the new shisa setting out puts it there
    await page.locator('#modal [data-role="0"]').click();
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

it.describe('the two shisa on the board', () => {
  it('blink now and then, and smile instead once they meet', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    const lv = await waitForLevel(page);
    for (const who of ['#hero', '#goal']) {
      await expect(page.locator(`${who} .lid`)).toHaveCount(2);
      expect(await animationOf(page, `${who} .lid`)).toBe('blink');
      await expect(page.locator(`${who} [data-smile]`)).toHaveCount(0);
    }
    await solveByDragging(page, lv);
    await expect(page.locator('#modal[data-kind="win"]')).toBeVisible();
    for (const who of ['#hero', '#goal']) {
      await expect(page.locator(`${who} [data-smile]`)).toHaveCount(1);
      await expect(page.locator(`${who} .lid`)).toHaveCount(0);
    }
  });
});

it.describe('a phone set to less motion', () => {
  it.use({ reducedMotion: 'reduce' });

  it('still walks the hero over to its friend instead of jumping there', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    const lv = await waitForLevel(page);
    await page.evaluate(() => {
      const w = window as unknown as { heroMoves: number };
      w.heroMoves = 0;
      new MutationObserver((ms) => {
        for (const m of ms) if ((m.target as Element).id === 'hero') w.heroMoves++;
      }).observe(document.body, { subtree: true, attributeFilter: ['transform'] });
    });
    await solveByDragging(page, lv);
    await expect(page.locator('#modal[data-kind="win"]')).toBeVisible();
    // Frame by frame along the road, not one jump to the end
    expect(await page.evaluate(() => (window as unknown as { heroMoves: number }).heroMoves)).toBeGreaterThan(10);
  });

  it('keeps the eyes open instead of blinking, and still smiles when the two meet', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    const lv = await waitForLevel(page);
    expect(await animationOf(page, '#hero .lid')).toBe('none');
    await expect(page.locator('#hero .lid').first()).toHaveCSS('opacity', '0');
    await solveByDragging(page, lv);
    await expect(page.locator('#hero [data-smile]')).toHaveCount(1);
  });
});
