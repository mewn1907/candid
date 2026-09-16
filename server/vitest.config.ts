// ©️ Mewn

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Prefer .ts sources: `tsc` (no outDir) leaves compiled .js beside the
  // sources, and Vite resolves .js first by default, which would test
  // stale build output instead of current sources.
  resolve: {
    extensions: ['.ts', '.mts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
