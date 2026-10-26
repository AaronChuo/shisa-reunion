import { ZONES } from '../src/content/zones';
import { freshProgress } from '../src/state/store';
import { expect, test as it } from './fixtures';

const save = (state: unknown) => JSON.stringify({ state: { progress: state }, version: 2 });
const SEEN = ['coach', 'stair', 'cube', 'tower', 'bridge'];

it.describe('stage backgrounds', () => {
  it('paints the zone’s own scene behind the board, turning to dusk from the third stop', async ({ page }) => {
    // Between Naha's second and third stops, with the next-stop card up
    const run = {
      zone: 'naha',
      zi: 0,
      si: 2,
      seed: 3,
      plan: [[], [], [], [], []],
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
    await page.click('#modal [data-card="next"]');
    const scene = page.locator('#board [data-time="dusk"] image');
    await expect(scene).toHaveAttribute('href', '/scenes/naha/dusk.webp');
    const res = await page.request.get('/scenes/naha/dusk.webp');
    expect(res.headers()['content-type']).toBe('image/webp');
  });
});

it.describe('wide ground on a narrow screen', () => {
  it.use({ viewport: { width: 250, height: 700 }, hasTouch: true });

  it('scrolls the field sideways and pans when empty ground is dragged', async ({ page }) => {
    const all = ZONES.map((z) => z.id);
    const state = {
      ...freshProgress(),
      open: all,
      clears: Object.fromEntries(all.map((id) => [id, 1])),
      // Every block and element card already read, so nothing covers the field
      seen: [...SEEN, 'bar', 'corner', 'parasol', 'wave', 'ladder', 'urchin', 'spring', 'vine'],
    };
    await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), save(state));
    await page.goto('/');
    // Yanbaru is 9 columns wide: too wide to fit 250 px with fingertip-sized cells
    await page.click(`.zone [data-zone="${all.indexOf('yanbaru')}"]`);
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
