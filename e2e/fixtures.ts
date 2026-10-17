import { test as base, expect } from '@playwright/test';

/** Marks the opening story as seen, on top of whatever save a test has seeded */
function storySeen() {
  const key = 'shisa-reunion';
  const raw = localStorage.getItem(key);
  const save = raw ? JSON.parse(raw) : { state: { progress: {} }, version: 2 };
  save.state ??= {};
  save.state.progress ??= {};
  const p = save.state.progress;
  p.seen = Array.from(new Set([...(p.seen ?? []), 'story']));
  localStorage.setItem(key, JSON.stringify(save));
}

/**
 * Most tests are about the game, not the opening story, so the story starts out seen. The script is added just before
 * the first navigation, so it runs after any save a test seeds with its own init script.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    let added = false;
    page.goto = async (...args: Parameters<typeof goto>) => {
      if (!added) {
        added = true;
        await page.addInitScript(storySeen);
      }
      return goto(...args);
    };
    await use(page);
  },
});

export { expect };
