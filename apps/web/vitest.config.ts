import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'test/server-only-stub.ts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
