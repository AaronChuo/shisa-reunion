import { expect, test as it } from '@playwright/test';
import { waitForLevel } from './helpers';

it.describe('offline play', () => {
  it('starts a new journey with the network switched off once the app has been opened', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // The worker takes control from the next load; after that everything comes from the cache
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('h1')).toHaveText('小獅搭路');
    await page.click('.zone [data-zone="0"]');
    await waitForLevel(page);
    await expect(page.locator('#board #hero')).toBeVisible();
  });
});
