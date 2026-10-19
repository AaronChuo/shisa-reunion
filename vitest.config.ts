import { availableParallelism } from 'node:os';
import { defineConfig } from 'vitest/config';

// The generation sweep tries every element combination and takes minutes, while one test file only ever runs on one
// thread. So it runs as one project per core, each taking a share of the cases (SWEEP_PART), side by side.
// `pnpm test` runs the quick suites, `pnpm test:gen` the sweep, `pnpm test:all` both.
const SWEEP = 'src/content/generation.sweep.test.ts';
const parts = availableParallelism();

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.test.ts'], exclude: [SWEEP] } },
      ...Array.from({ length: parts }, (_, i) => ({
        extends: true,
        test: { name: `sweep-${i + 1}`, include: [SWEEP], env: { SWEEP_PART: `${i + 1}/${parts}` } },
      })),
    ],
  },
});
