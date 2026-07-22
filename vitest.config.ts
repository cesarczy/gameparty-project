import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@identity': path.resolve(__dirname, 'src/modules/identity'),
      '@catalog': path.resolve(__dirname, 'src/modules/catalog'),
      '@live-rooms': path.resolve(__dirname, 'src/modules/live-rooms'),
    },
  },
});
