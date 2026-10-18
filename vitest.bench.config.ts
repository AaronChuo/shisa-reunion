import { defineConfig } from 'vitest/config';

// `pnpm bench:gen`: compares the two ways of generating levels (see scripts/bench-gen.ts)
export default defineConfig({
  test: {
    include: ['scripts/bench-gen.ts'],
    environment: 'node',
    testTimeout: 600000,
  },
});
