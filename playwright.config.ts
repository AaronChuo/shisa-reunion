import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1180, height: 820 } }, testIgnore: /layout\.spec/ },
    { name: 'phone', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /layout\.spec/ },
    // A short viewport like a phone app's embedded browser, where the gacha machine once covered its tabs
    { name: 'phone-short', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 600 }, channel: 'chrome' }, testMatch: /layout\.spec/ },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
