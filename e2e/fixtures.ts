import { test as base, expect } from '@playwright/test';
import { PLACE_ORDER, placeSeen } from '../src/content/places';

/** Marks the opening story and every postcard as seen, on top of whatever save a test has seeded */
function storySeen(extra: string[]) {
  const key = 'shisa-reunion';
  const raw = localStorage.getItem(key);
  const save = raw ? JSON.parse(raw) : { state: { progress: {} }, version: 2 };
  save.state ??= {};
  save.state.progress ??= {};
  const p = save.state.progress;
  p.seen = Array.from(new Set([...(p.seen ?? []), 'story', ...extra]));
  localStorage.setItem(key, JSON.stringify(save));
}

/**
 * Most tests are about the game, not the opening story or the postcards, so those start out seen. The script is added just before
 * the first navigation, so it runs after any save a test seeds with its own init script.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    let added = false;
    page.goto = async (...args: Parameters<typeof goto>) => {
      if (!added) {
        added = true;
        await page.addInitScript(storySeen, PLACE_ORDER.map(placeSeen));
      }
      return goto(...args);
    };
    await use(page);
  },
});

export { expect };
