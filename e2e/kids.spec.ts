import type { Page } from '@playwright/test';
import { voiceKey } from '../src/audio/voice';
import { coachLine, stopLine } from '../src/content/hints';
import { STARTERS, VARIANT_BY_ID } from '../src/content/shisa';
import { expect, test as it } from './fixtures';
import { progress, solveByDragging, waitForLevel } from './helpers';

/** The shisa's recording of a line, as the game asks for it */
const shisaVoice = (text: string) => `/voice/${voiceKey(text, 'shisa')}.mp3`;

/** Every recording the page asks for */
function voiceRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/voice/')) urls.push(new URL(r.url()).pathname);
  });
  return urls;
}

/** A save past the first-stop demonstration */
async function pastCoach(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('shisa-reunion')) localStorage.setItem('shisa-reunion', JSON.stringify({ state: { progress: { seen: ['coach'] } }, version: 2 }));
  });
}

// For children who can't read yet: one big button to press, pictures, and a finger that shows what to do
it.describe('playing without reading', () => {
  it('offers exactly one main button on the map and it starts the first zone', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home .cta')).toHaveCount(1);
    await page.click('#goBtn');
    const lv = await waitForLevel(page);
    expect((await progress(page)).run?.zone).toBe('naha');
    expect(lv.inv.length).toBeGreaterThan(0);
  });

  it('points a finger at the main button when the child sits still', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await expect(page.locator('#goBtn .tapHand')).toHaveCount(0);
    await page.clock.fastForward(6000);
    await expect(page.locator('#goBtn .tapHand')).toBeVisible();
  });

  it('acts out the first drag with a finger and stops once the block is placed', async ({ page }) => {
    await page.goto('/');
    await page.click('#goBtn');
    const lv = await waitForLevel(page);
    await expect(page.locator('.dragDemo')).toBeVisible();
    // The demonstration is free: the youngest still have two hint shells for each block
    expect((await progress(page)).run?.shell).toBe(lv.inv.length * 2);
    await solveByDragging(page, lv);
    await expect(page.locator('.dragDemo')).toHaveCount(0);
  });

  it("has the shisa say the first stop's line aloud", async ({ page }) => {
    const line = coachLine(VARIANT_BY_ID[STARTERS[0]].name, VARIANT_BY_ID[STARTERS[1]].name, 0);
    await page.goto('/');
    const recording = page.waitForResponse((r) => r.url().endsWith(shisaVoice(line)));
    await page.click('#goBtn');
    await waitForLevel(page);
    await expect(page.locator('#bubble')).toHaveText(line);
    expect((await recording).ok()).toBe(true);
  });

  it("says how many blocks a stop needs, and the hint asked for, in the shisa's voice", async ({ page }) => {
    await pastCoach(page);
    const asked = voiceRequests(page);
    await page.goto('/');
    await page.click('#goBtn');
    const lv = await waitForLevel(page);
    await expect.poll(() => asked).toContain(shisaVoice(stopLine(lv.inv.length, lv.stars.length)));
    await page.click('#hintBtn');
    await expect(page.locator('#bubble')).toContainText('把發亮的');
    const hint = (await page.locator('#bubble').textContent()) ?? '';
    await expect.poll(() => asked).toContain(shisaVoice(hint));
  });

  it('keeps the shisa quiet with the sound effects off', async ({ page }) => {
    await pastCoach(page);
    const asked = voiceRequests(page);
    await page.goto('/');
    await page.click('#audioBtn');
    await page.click('#sfxSwitch');
    await expect(page.locator('#sfxSwitch')).toHaveAttribute('aria-checked', 'false');
    await page.click('#modal [data-focus]');
    await page.click('#goBtn');
    await waitForLevel(page);
    await page.click('#hintBtn');
    await expect(page.locator('#bubble')).toContainText('把發亮的');
    await page.waitForTimeout(500);
    expect(asked).toEqual([]);
  });

  it('turns the gacha button into "go play" when there are no coins', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="gacha"]');
    await expect(page.locator('#coinBtn')).toHaveCount(0);
    await page.click('#playBtn');
    await expect(page.locator('#home')).toBeVisible();
  });

  it('shows the two jobs as open and closed mouths in the collection', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('[data-pick="celadon"]');
    await expect(page.locator('#modal .roleCard')).toHaveCount(2);
    await page.click('#modal [data-role="0"]');
    await expect(page.locator('#modal')).toHaveCount(0);
    expect((await progress(page)).pair).toEqual(['celadon', 'terracotta']);
  });
});
