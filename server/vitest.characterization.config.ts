import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/testing/characterization/**/*.test.ts'],
    isolate: true,
    reporters: ['dot'],
    silent: true,
    typecheck: {
      tsconfig: 'tsconfig.test.json',
    },
    watch: false,
    env: {
      NODE_ENV: 'test',
    },
  },
});
