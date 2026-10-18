import { planRun, relax, stageCfg, ZONES } from '../src/content/zones';
import { generate } from '../src/engine';
import { freshProgress } from '../src/state/store';
import { expect, test as it } from './fixtures';
import { dismissIntros, progress, solveByDragging } from './helpers';

const save = (state: unknown) => JSON.stringify({ state: { progress: state }, version: 2 });

it.describe('new islands', () => {
  // Kouri brings the spring, Taketomi star sand, Iriomote the vine, Shuri the stone gate: each lesson must be playable to the end
  for (const id of ['kouri', 'taketomi', 'iriomote', 'shuri']) {
    it(`plays the first stop of ${id} through to the win`, async ({ page }) => {
      const zi = ZONES.findIndex((z) => z.id === id);
      const plan = planRun(zi, [], 7);
      const level = generate(stageCfg(zi, 0, plan[0]), 7, relax);
      const run = {
        zone: id,
        zi,
        si: 0,
        seed: 7,
        plan,
        road: [null, null, null, null, null],
        level,
        placed: [],
        moves: 0,
        hist: [],
        orient: level.inv.map(() => 0),
        shell: 2,
        conch: 1,
        earned: 0,
        rerolls: 0,
        phase: 'play',
      };
      const state = { ...freshProgress(), open: ZONES.map((z) => z.id), run };
      await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), save(state));
      await page.goto('/');
      await page.click('[data-resume]');
      await dismissIntros(page);
      await solveByDragging(page, level);
      await expect(page.locator('#modal[data-kind="win"]')).toBeVisible({ timeout: 20_000 });
    });
  }

  it('upgrades a save from before the new islands, keeps Shuri open and opens zones by tier', async ({ page }) => {
    const old = { ...freshProgress(), open: undefined, unlocked: 3, clears: [1, 1, 1, 0] };
    await page.addInitScript(
      (s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s),
      JSON.stringify({ state: { progress: old }, version: 1 }),
    );
    await page.goto('/');
    // Finishing Yomitan opens every 進階 zone, and finishing Motobu opens every 高手 zone
    for (const zi of [3, 4, 5, 6]) await expect(page.locator(`.zone [data-zone="${zi}"]`)).toBeEnabled();
    expect((await progress(page)).open).toEqual(['naha', 'yomitan', 'motobu', 'kouri', 'taketomi', 'iriomote', 'shuri']);
  });
});

it.describe('shisa stories', () => {
  it('reads a story aloud with the Japanese word swapped for its reading', async ({ page }) => {
    await page.addInitScript(() => {
      const said: string[] = [];
      (window as unknown as { said: string[] }).said = said;
      const fake = {
        speak: (u: SpeechSynthesisUtterance) => {
          said.push(u.text);
          setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 10);
        },
        cancel: () => {},
        getVoices: () => [],
      };
      Object.defineProperty(window, 'speechSynthesis', { value: fake });
    });
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('[data-pick="terracotta"]');
    await expect(page.locator('#modal .tale p')).toContainText('西薩（シーサー）');
    await page.click('#modal [data-read]');
    await expect.poll(() => page.evaluate(() => (window as unknown as { said: string[] }).said.join(''))).toContain('「西薩」');
    expect(await page.evaluate(() => (window as unknown as { said: string[] }).said.join(''))).not.toMatch(/[぀-ヿ]/);
  });

  it('explains what a shisa is from the collection', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('#aboutBtn');
    await expect(page.locator('#modal')).toContainText('金門');
  });
});
