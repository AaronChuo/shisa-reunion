import { planRun, relax, stageCfg, ZONES } from '../src/content/zones';
import { generate } from '../src/engine';
import { freshProgress } from '../src/state/store';
import { expect, test as it } from './fixtures';
import { dismissIntros, progress, solveByDragging } from './helpers';

const save = (state: unknown) => JSON.stringify({ state: { progress: state }, version: 2 });

it.describe('new islands', () => {
  // Each zone's lesson must be playable to the end: Onna's spring, Kouri's urchins, Yanbaru's vine, Nakagusuku's stone
  // bridge, Shuri's stone gate, Kumejima's tide, Miyako's slide and Ishigaki's star sand
  for (const id of ['onna', 'kouri', 'yanbaru', 'nakagusuku', 'shuri', 'kumejima', 'miyako', 'ishigaki']) {
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
    // Finishing Yomitan opens every 進階 zone; one 進階 zone finished is not yet enough for 高手
    const zone = (id: string) => page.locator(`.zone [data-zone="${ZONES.findIndex((z) => z.id === id)}"]`);
    for (const id of ['onna', 'kouri', 'shuri']) await expect(zone(id)).toBeEnabled();
    await expect(zone('yanbaru')).toBeDisabled();
    expect((await progress(page)).open).toEqual(['naha', 'chatan', 'yomitan', 'onna', 'motobu', 'kouri', 'shuri']);
  });
});

it.describe('shisa stories', () => {
  it('plays the recorded narration of a story', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('[data-pick="terracotta"]');
    const recording = page.waitForResponse((r) => /\/voice\/[0-9a-f]{16}\.mp3$/.test(r.url()));
    await page.click('#modal [data-read]');
    expect((await recording).ok()).toBe(true);
    await expect(page.locator('#modal [data-read]')).toHaveAttribute('aria-pressed', 'true');
  });

  it('waits for the audio to wake on the tap, as on iPhone and iPad, instead of switching to the device voice', async ({ page }) => {
    await page.addInitScript(() => {
      // Safari starts audio suspended and wakes it a moment after the tap
      const Real = window.AudioContext;
      class SlowWake extends Real {
        awake = false;
        waking = 0;
        constructor(...args: ConstructorParameters<typeof AudioContext>) {
          super(...args);
          (window as unknown as { ctx: SlowWake }).ctx = this;
        }
        get state() {
          return this.awake ? super.state : 'suspended';
        }
        resume() {
          this.waking++;
          return new Promise<void>((done) =>
            setTimeout(() => {
              this.waking--;
              this.awake = true;
              super.resume().then(done);
            }, 200),
          );
        }
      }
      window.AudioContext = SlowWake;
      const said: string[] = [];
      (window as unknown as { said: string[] }).said = said;
      const fake = { speak: (u: SpeechSynthesisUtterance) => said.push(u.text), cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, 'speechSynthesis', { value: fake });
    });
    await page.goto('/');
    await page.click('[data-go="dex"]');
    await page.click('[data-pick="terracotta"]');
    // Coming back from the background, the audio is asleep again until the next tap
    type Ctx = { ctx: { awake: boolean; waking: number } };
    await expect.poll(() => page.evaluate(() => (window as unknown as Ctx).ctx.waking)).toBe(0);
    await page.evaluate(() => {
      (window as unknown as Ctx).ctx.awake = false;
    });
    const recording = page.waitForResponse((r) => /\/voice\/[0-9a-f]{16}\.mp3$/.test(r.url()));
    await page.click('#modal [data-read]');
    expect((await recording).ok()).toBe(true);
    // Only the empty line that unlocks speech on the first tap, nothing read in the device voice
    expect(await page.evaluate(() => (window as unknown as { said: string[] }).said.filter(Boolean))).toEqual([]);
  });

  it('reads a story with the device voice when the recording cannot load, the Japanese word swapped for its reading', async ({ page }) => {
    await page.route('**/voice/*.mp3', (r) => r.abort());
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
