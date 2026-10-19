import { defineConfig } from 'vitest/config';

// `pnpm bench:gen` compares the two ways of generating levels (scripts/bench-gen.ts); `pnpm bench:solver` times the
// solver against the one before relevance pruning (scripts/bench-solver.ts)
export default defineConfig({
  test: {
    include: ['scripts/bench-*.ts'],
    environment: 'node',
    testTimeout: 600000,
  },
});
