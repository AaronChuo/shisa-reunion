import { freshProgress } from '../src/state/store';
import { expect, test as it } from './fixtures';

const save = (state: unknown) => JSON.stringify({ state: { progress: state }, version: 2 });
const SEEN = ['coach', 'stair', 'cube', 'tower', 'bridge'];

it.describe('scenery roads', () => {
  it('lets the child pick one of two roads, and the board then shows that road’s time of day', async ({ page }) => {
    // Naha's third stop starts with a choice of roads
    const run = {
      zone: 'naha',
      zi: 0,
      si: 2,
      seed: 3,
      plan: [[], [], [], [], []],
      road: [null, null, null, null, null],
      level: null,
      placed: [],
      moves: 0,
      hist: [],
      orient: [],
      shell: 2,
      conch: 1,
      earned: 2,
      rerolls: 0,
      phase: 'choose',
    };
    const state = { ...freshProgress(), seen: SEEN, run };
    await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), save(state));
    await page.goto('/');
    await page.click('[data-resume]');
    const roads = page.locator('#modal [data-card="road"]');
    await expect(roads).toHaveCount(2);
    const pick = roads.nth(1);
    const time = await pick.getAttribute('data-time');
    await pick.click();
    await expect(page.locator(`#board [data-time="${time}"]`)).toBeAttached();
  });
});

it.describe('wide ground on a narrow screen', () => {
  it.use({ viewport: { width: 250, height: 700 }, hasTouch: true });

  it('scrolls the field sideways and pans when empty ground is dragged', async ({ page }) => {
    const all = ['naha', 'yomitan', 'motobu', 'kouri', 'taketomi', 'iriomote', 'shuri'];
    const state = {
      ...freshProgress(),
      open: all,
      clears: Object.fromEntries(all.map((id) => [id, 1])),
      seen: [...SEEN, 'ladder', 'urchin', 'spring', 'star'],
    };
    await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), save(state));
    await page.goto('/');
    // Taketomi is 8 columns wide: too wide to fit 250 px with fingertip-sized cells
    await page.click('.zone [data-zone="4"]');
    const box = page.locator('.boardScroll.scrollX');
    await expect(box).toBeVisible({ timeout: 15_000 });
    const { sw, cw } = await box.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(sw).toBeGreaterThan(cw);
    // Wait for the opening look across the field to finish, then drag the sky
    await page.waitForTimeout(4500);
    const before = await box.evaluate((el) => el.scrollLeft);
    const r = await page.locator('#board').boundingBox();
    if (!r) throw new Error('no board');
    const y = r.y + r.height * 0.2;
    const from = before > 10 ? r.x + 40 : r.x + r.width - 40;
    const to = before > 10 ? r.x + r.width - 40 : r.x + 40;
    const sx = Math.min(Math.max(from, 20), 230);
    const ex = Math.min(Math.max(to, 20), 230);
    await page.mouse.move(sx, y);
    await page.mouse.down();
    await page.mouse.move((sx + ex) / 2, y, { steps: 4 });
    await page.mouse.move(ex, y, { steps: 4 });
    await page.mouse.up();
    expect(await box.evaluate((el) => el.scrollLeft)).not.toBe(before);
  });
});
