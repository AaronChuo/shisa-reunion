import type { Page } from '@playwright/test';
import { relax, stageCfg } from '../src/content/zones';
import { generate } from '../src/engine';
import { expect, test as it } from './fixtures';
import { dismissIntros, progress, solveByDragging, waitForLevel } from './helpers';

const KEY = 'shisa-reunion';

/** A save with these progress fields; anything left out is filled in as for a new player */
const seed = (page: Page, p: Record<string, unknown>) =>
  page.addInitScript(([key, s]) => localStorage.getItem(key) || localStorage.setItem(key, s), [KEY, JSON.stringify({ state: { progress: p }, version: 2 })]);

/** A journey through Naha, on its first stop with the level built, holding these hint shells and rerolls */
function nahaRun(shell: number, conch: number | null) {
  const level = generate(stageCfg(0, 0, []), 5, relax);
  const run = { zone: 'naha', zi: 0, si: 0, seed: 5, plan: [[], [], [], [], []], level, placed: [], moves: 0, hist: [], orient: level.inv.map(() => 0) };
  return { ...run, shell, conch, earned: 0, rerolls: 0, phase: 'play' };
}

/** Clears the stop on the board and sets off for the next one */
async function clearStop(page: Page) {
  await solveByDragging(page, await waitForLevel(page));
  await page.locator('#modal[data-kind="win"] [data-next]').click();
  await page.locator('#modal[data-kind="branch"] [data-card]').first().click();
  return waitForLevel(page);
}

/** The keyboard opens the grown-ups' settings at once (a finger has to hold the button) */
async function openParents(page: Page) {
  await page.click('#audioBtn');
  await page.focus('#parentsBtn');
  await page.keyboard.press('Enter');
  await expect(page.locator('#modal[data-kind="parents"]')).toBeVisible();
}

it.describe('who is playing', () => {
  it('asks a grown-up on the map once for a save that never answered, and remembers the answer', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { keepAgeUnset: boolean }).keepAgeUnset = true;
    });
    await seed(page, { age: null });
    await page.goto('/');
    const ask = page.locator('#modal[data-kind="age"]');
    await expect(ask).toBeVisible();
    await page.click('.ageCard[data-age="big"]');
    await expect(ask).toHaveCount(0);
    const p = await progress(page);
    expect(p.age).toBe('big');
    expect(p.restMin).toBeNull();
    await page.reload();
    await expect(page.locator('#goBtn')).toBeVisible();
    await expect(ask).toHaveCount(0);
  });

  it('shows older players no pointing finger', async ({ page }) => {
    await page.clock.install();
    await seed(page, { age: 'big' });
    await page.goto('/');
    await page.clock.fastForward(20_000);
    await expect(page.locator('#goBtn .tapHand')).toHaveCount(0);
  });

  it('lets the youngest reroll as often as they like, with twice as many hints as blocks', async ({ page }) => {
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    const lv = await waitForLevel(page);
    const run = (await progress(page)).run;
    expect(run?.shell).toBe(lv.inv.length * 2);
    expect(run?.conch).toBeNull();
    await expect(page.locator('#rerollBtn b')).toHaveCount(0);
    await page.click('#rerollBtn');
    await expect(page.locator('#rerollBtn')).toBeEnabled();
    expect((await progress(page)).run?.conch).toBeNull();
  });

  it('hands 6–11 as many hints as blocks and two rerolls on arriving at every stop', async ({ page }) => {
    await seed(page, { age: 'kid', seen: ['coach'], run: nahaRun(0, 0) });
    await page.goto('/');
    await page.click('[data-resume]');
    await dismissIntros(page);
    await expect(page.locator('#hintBtn')).toBeDisabled();
    await expect(page.locator('#rerollBtn')).toBeDisabled();
    const lv = await clearStop(page);
    const run = (await progress(page)).run;
    expect(run?.shell).toBe(lv.inv.length);
    expect(run?.conch).toBe(2);
    await expect(page.locator('#rerollBtn b')).toHaveText('2');
  });

  it('gives 12 and up the zone’s stars in hints and two rerolls, for the whole journey', async ({ page }) => {
    await seed(page, { age: 'big', seen: ['coach'] });
    await page.goto('/');
    await page.click('.zone [data-zone="0"]');
    await waitForLevel(page);
    // Naha has one star
    expect((await progress(page)).run).toMatchObject({ shell: 1, conch: 2 });
    await expect(page.locator('#hintBtn b')).toHaveText('1');

    // What is left carries over to the next stop
    await page.evaluate(
      (r) => {
        const s = JSON.parse(localStorage.getItem('shisa-reunion') ?? '{}');
        s.state.progress.run = r;
        localStorage.setItem('shisa-reunion', JSON.stringify(s));
      },
      nahaRun(0, 1),
    );
    await page.reload();
    await page.click('[data-resume]');
    await clearStop(page);
    expect((await progress(page)).run).toMatchObject({ si: 1, shell: 0, conch: 1 });
    await expect(page.locator('#hintBtn')).toBeDisabled();
  });
});

it.describe("grown-ups' settings", () => {
  it('open only when the button is held, not on a tap', async ({ page }) => {
    await page.goto('/');
    await page.click('#audioBtn');
    await page.click('#parentsBtn');
    await expect(page.locator('#modal[data-kind="parents"]')).toHaveCount(0);
    const b = await page.locator('#parentsBtn').boundingBox();
    if (!b) throw new Error('no grown-ups button');
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect(page.locator('#modal[data-kind="parents"]')).toBeVisible({ timeout: 3000 });
    await page.mouse.up();
    await page.click('#modal .ageCard[data-age="kid"]');
    expect((await progress(page)).age).toBe('kid');
    // The rest reminder follows the age, and can then be changed
    expect((await progress(page)).restMin).toBe(30);
    await page.click('.chip[data-rest="45"]');
    expect((await progress(page)).restMin).toBe(45);
  });

  it('remind the child to rest at a break once the chosen time has passed', async ({ page }) => {
    await page.clock.install();
    await seed(page, { age: 'little', restMin: 15 });
    await page.goto('/');
    await expect(page.locator('#goBtn')).toBeVisible();
    await page.clock.fastForward('14:00');
    await expect(page.locator('#modal')).toHaveCount(0);
    await page.clock.fastForward('01:10');
    const rest = page.locator('#modal[data-kind="rest"]');
    await expect(rest).toBeVisible();
    await rest.locator('.cta').click();
    await expect(page.locator('#modal')).toHaveCount(0);
  });

  it('carry progress to another device with a backup code', async ({ page }) => {
    await seed(page, { tokens: 9, clears: { naha: 1 } });
    await page.goto('/');
    await openParents(page);
    await page.click('#saveBackupBtn');
    const code = await page.locator('#backupCode').inputValue();
    expect(code).toMatch(/^SHISA1-/);

    // The other device: a new player
    await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ state: { progress: {} }, version: 2 })), KEY);
    await page.reload();
    const coins = page.locator('.homeTools .coin .num');
    await expect(coins).toHaveText('0');
    await openParents(page);
    await page.click('#loadBackupBtn');
    await page.fill('#restoreCode', code.slice(0, -2));
    await page.click('#checkBackupBtn');
    await expect(page.locator('#backupBad')).toBeVisible();
    await page.fill('#restoreCode', `\n${code}\n`);
    await page.click('#checkBackupBtn');
    await expect(page.locator('#backupFound')).toContainText('福氣幣 9 枚');
    await page.click('#restoreBtn');
    await expect(page.locator('#modal')).toHaveCount(0);
    await expect(coins).toHaveText('9');
    const p = await progress(page);
    expect(p.tokens).toBe(9);
    expect(p.clears.naha).toBe(1);
  });
});
