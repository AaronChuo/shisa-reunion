import type { Page } from '@playwright/test';
import { STARTERS, VARIANT_BY_ID, VARIANTS } from '../src/content/shisa';
import { freshProgress } from '../src/state/store';
import { expect, test as it } from './fixtures';
import { animationOf, progress } from './helpers';

const seed = (tokens: number) => JSON.stringify({ state: { progress: { ...freshProgress(), tokens } }, version: 2 });

async function open(page: Page, tokens: number) {
  await page.addInitScript((s) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', s), seed(tokens));
  await page.goto('/');
  await page.click('[data-go="gacha"]');
}

async function centre(page: Page, sel: string) {
  const b = await page.locator(sel).boundingBox();
  if (!b) throw new Error(`${sel} not visible`);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, r: Math.min(b.width, b.height) / 2 };
}

/** Turns the crank by dragging round it clockwise, `turns` times */
async function turnCrank(page: Page, turns: number) {
  const c = await centre(page, '#crank');
  const rr = c.r * 0.7;
  await page.mouse.move(c.x, c.y - rr);
  await page.mouse.down();
  for (let i = 1; i <= turns * 24; i++) {
    const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
    await page.mouse.move(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr);
  }
  await page.mouse.up();
}

it.describe('a gacha machine you work by hand', () => {
  it('holds one capsule per shisa still to collect', async ({ page }) => {
    await open(page, 0);
    // Traditional series: 10 shisa, 2 owned from the start
    await expect(page.locator('#machineBox .capsule')).toHaveCount(8);
    await page.click('[data-series="animal"]');
    await expect(page.locator('#machineBox .capsule')).toHaveCount(5);
    // The island machine: ten shisa from Okinawa's outlying islands
    await page.click('[data-series="island"]');
    await expect(page.locator('#machineBox .capsule')).toHaveCount(10);
    await expect(page.locator('.machine')).toHaveAttribute('aria-label', /離島系列/);
  });

  it('takes a coin dragged into the slot, then drops a capsule after one turn of the crank', async ({ page }) => {
    await open(page, 1);
    const purse = await centre(page, '#purse');
    const slot = await centre(page, '#slot');
    await page.mouse.move(purse.x, purse.y);
    await page.mouse.down();
    await page.mouse.move(slot.x, slot.y, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('#turnBtn')).toBeVisible();
    // The coin is only spent once a capsule comes out
    expect((await progress(page)).tokens).toBe(1);
    await turnCrank(page, 1.1);
    await expect(page.locator('#outCap')).toBeVisible();
    await expect(page.locator('#machineBox .capsule')).toHaveCount(7);
    const p = await progress(page);
    expect(p.tokens).toBe(0);
    expect(p.owned).toHaveLength(3);
    await page.click('#outCap');
    await expect(page.locator('#modal[data-kind="reveal"]')).toBeVisible();
    // The capsule flies up from the machine's tray rather than just appearing
    await expect(page.locator('#capsule')).toHaveClass(/flyIn/);
  });

  it('refuses to turn without a coin', async ({ page }) => {
    await open(page, 1);
    await turnCrank(page, 1.2);
    await expect(page.locator('#outCap')).toHaveCount(0);
    await expect(page.locator('#coinBtn')).toBeVisible();
    expect((await progress(page)).tokens).toBe(1);
  });

  it('turns back only by slipping: winding the crank the wrong way drops nothing', async ({ page }) => {
    await open(page, 1);
    await page.click('#slot');
    const c = await centre(page, '#crank');
    const rr = c.r * 0.7;
    await page.mouse.move(c.x, c.y - rr);
    await page.mouse.down();
    for (let i = 1; i <= 30; i++) {
      const a = -Math.PI / 2 - (i / 24) * Math.PI * 2;
      await page.mouse.move(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr);
    }
    await page.mouse.up();
    await expect(page.locator('#outCap')).toHaveCount(0);
    expect((await progress(page)).tokens).toBe(1);
  });

  it.describe('a shisa just out of its capsule', () => {
    async function pullOne(page: Page) {
      await open(page, 1);
      await page.locator('#coinBtn').click();
      await page.locator('#turnBtn').click();
      await page.locator('#openBtn').click();
      await page.locator('#capsule').click();
    }

    it('joins the pair as the one waiting when that picture is picked', async ({ page }) => {
      await pullOne(page);
      // Two pictures of the pair as it would be, the new shisa glowing in each, and the question to hear
      await expect(page.locator('#modal .roleCard .fresh')).toHaveCount(2);
      await expect(page.locator('#modal .askAloud')).toContainText('閉著嘴巴');
      await expect(page.locator('#modal [data-ask]')).toBeVisible();
      await page.locator('#modal [data-role="1"]').click();
      await expect(page.locator('#modal')).toHaveCount(0);
      const p = await progress(page);
      expect(p.pair).toEqual(['terracotta', p.owned[2]]);
    });

    it('goes into the collection and leaves the pair as it was when kept for later', async ({ page }) => {
      await pullOne(page);
      await page.locator('#modal [data-keep]').click();
      await expect(page.locator('#modal')).toHaveCount(0);
      const p = await progress(page);
      expect(p.owned).toHaveLength(3);
      expect(p.pair).toEqual(['terracotta', 'celadon']);
    });
  });

  it.describe('on a phone set to less motion', () => {
    it.use({ reducedMotion: 'reduce' });

    it('still shows how to put a coin in, and brings the capsule out without the spin', async ({ page }) => {
      await open(page, 1);
      await expect(page.locator('.coinDemo')).toBeVisible();
      expect(await animationOf(page, '.coinDemo')).toBe('coinDemo');
      await page.locator('#coinBtn').click();
      await page.locator('#turnBtn').click();
      await page.locator('#openBtn').click();
      await expect(page.locator('#capsule')).toHaveClass(/flyIn/);
      expect(await animationOf(page, '#capsule')).toBe('capsuleSlide');
    });
  });
});

it.describe('round 2: decorations for 西薩的家', () => {
  const trad = VARIANTS.filter((v) => v.series === 'trad').map((v) => v.id);
  /** A save with every traditional shisa collected, as a player of this age */
  async function upgraded(page: Page, age: string, tokens: number) {
    const s = JSON.stringify({ state: { progress: { ...freshProgress(), tokens, owned: [...STARTERS, ...trad], age } }, version: 2 });
    await page.addInitScript((v) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', v), s);
    await page.goto('/');
    await page.click('[data-go="gacha"]');
  }

  it('goes up to round 2 once its shisa are all in, and takes two coins a capsule from a child 6 or older', async ({ page }) => {
    await upgraded(page, 'kid', 3);
    // Said once: the eight decorations by name, the rare one still a secret, and a little house showing what they are for
    await expect(page.locator('#modal[data-kind="upgrade"] .sheet')).toBeVisible();
    await expect(page.locator('#modal .upgradeRow li')).toHaveCount(8);
    await expect(page.locator('#modal .upgradeRow .secret')).toHaveCount(1);
    await expect(page.locator('#modal .upgradeRow li.rare')).toHaveAttribute('data-id', 'goldStone');
    await expect(page.locator('#modal .upgradeRow li[data-id="fukugi"]')).toHaveText('福木');
    await expect(page.locator('#modal .upgradeHouse .uStk')).toHaveCount(2);
    await expect(page.locator('#modal .tale')).toContainText('放進西薩的家');
    await page.click('#modal [data-ok]');
    await expect(page.locator('#machineBox .capsule')).toHaveCount(8);
    await expect(page.locator('[data-series="trad"] small')).toHaveText('0/8');
    // A hole either side of the slit; the crank turns once both are lit
    await expect(page.locator('.coinHole')).toHaveCount(2);
    await page.locator('#coinBtn').click();
    await expect(page.locator('#coinBtn')).toHaveText(/再投 1 枚/);
    await expect(page.locator('#turnBtn')).toHaveCount(0);
    await page.locator('#coinBtn').click();
    await page.locator('#turnBtn').click();
    await page.locator('#openBtn').click();
    await page.locator('#capsule').click();
    // 放到家裡: the decoration is already in the yard when the house opens
    await page.locator('#modal [data-to-house]').click();
    await expect(page.locator('#house')).toBeVisible();
    const p = await progress(page);
    expect(p.tokens).toBe(1);
    expect(p.decor).toHaveLength(1);
    expect(p.house.placed.map((s) => s.id)).toEqual(p.decor);
    await expect(page.locator(`.hStk[data-id="${p.decor[0]}"]`)).toHaveCount(1);
    // Back at the machine the notice doesn't come again
    await page.click('[data-go="home"]');
    await page.click('[data-go="gacha"]');
    await expect(page.locator('#modal')).toHaveCount(0);
    await expect(page.locator('[data-series="trad"] small')).toHaveText('1/8');
  });

  it('lets the last shisa roll out and be opened and kept before the machine goes up, and keeps working after', async ({ page }) => {
    const [last, ...rest] = trad.filter((id) => !STARTERS.includes(id));
    const s = JSON.stringify({ state: { progress: { ...freshProgress(), tokens: 3, owned: [...STARTERS, ...rest], age: 'kid' } }, version: 2 });
    await page.addInitScript((v) => localStorage.getItem('shisa-reunion') || localStorage.setItem('shisa-reunion', v), s);
    await page.goto('/');
    await page.click('[data-go="gacha"]');
    await expect(page.locator('#machineBox .capsule')).toHaveCount(1);
    await page.locator('#coinBtn').click();
    await page.locator('#turnBtn').click();
    // The last capsule lands in the tray of the same machine; nothing goes up yet
    await expect(page.locator('#outCap')).toBeVisible();
    await expect(page.locator('#modal')).toHaveCount(0);
    await expect(page.locator('.gPanel')).toContainText('都收齊了');
    await page.locator('#openBtn').click();
    await page.locator('#capsule').click();
    await expect(page.locator('#modal[data-kind="reveal"] h2')).toHaveText(VARIANT_BY_ID[last].name);
    await page.locator('#modal [data-keep]').click();
    // Kept: now the machine goes up while the player watches, the new capsules pouring in before the notice shows
    await expect(page.locator('#machineBox .machineFrame.up')).toHaveCount(1);
    await expect(page.locator('#modal[data-kind="upgrade"] .sheet')).toBeHidden();
    await expect(page.locator('#machineBox .capsule')).toHaveCount(8);
    await expect(page.locator('#modal[data-kind="upgrade"] .sheet')).toBeVisible();
    await expect(page.locator('#modal [data-ok]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#modal')).toHaveCount(0);
    await expect(page.locator('#machineBox .machineFrame.up')).toHaveCount(0);
    await expect(page.locator('[data-series="trad"] small')).toHaveText('0/8');
    // Still free to pick another machine, and to turn this one at round 2's price
    await page.click('[data-series="sea"]');
    await expect(page.locator('[data-series="sea"]')).toHaveAttribute('aria-pressed', 'true');
    await page.click('[data-series="trad"]');
    await page.locator('#coinBtn').click();
    await page.locator('#coinBtn').click();
    await page.locator('#turnBtn').click();
    await page.locator('#openBtn').click();
    await page.locator('#capsule').click();
    await expect(page.locator('#modal [data-to-house]')).toBeVisible();
    const p = await progress(page);
    expect(p.owned).toContain(last);
    expect(p.decor).toHaveLength(1);
    expect(p.tokens).toBe(0);
  });

  it.describe('on a phone set to less motion', () => {
    it.use({ reducedMotion: 'reduce' });

    it('still pours the new capsules in before the notice, which then just appears', async ({ page }) => {
      await upgraded(page, 'kid', 0);
      await expect(page.locator('#machineBox .capsule')).toHaveCount(8);
      await expect(page.locator('#modal[data-kind="upgrade"] .sheet')).toBeVisible();
      expect(await animationOf(page, '#modal .sheet')).toBe('hiddenUntil');
      expect(await animationOf(page, '#machineBox .machine')).toBe('none');
    });
  });

  it('takes one coin a capsule from a child under 6, and a decoration can be kept for later', async ({ page }) => {
    await upgraded(page, 'little', 1);
    await page.click('#modal [data-ok]');
    await expect(page.locator('.coinHole')).toHaveCount(0);
    await page.locator('#coinBtn').click();
    await page.locator('#turnBtn').click();
    await page.locator('#openBtn').click();
    await page.locator('#capsule').click();
    await page.locator('#modal [data-keep]').click();
    const p = await progress(page);
    expect(p.tokens).toBe(0);
    expect(p.decor).toHaveLength(1);
    expect(p.house.placed).toEqual([]);
  });
});
