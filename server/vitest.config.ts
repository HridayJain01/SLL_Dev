import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Only the sources. A stale `dist` would otherwise be collected twice.
    include: ['src/**/*.test.ts'],
    // The suite boots one in-memory replica set and shares it; running files in
    // parallel would fight over it.
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
