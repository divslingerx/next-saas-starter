import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/global.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
    // Separate environments for different test types
    environmentMatchGlobs: [
      ['**/*.component.test.{ts,tsx}', 'jsdom'],
      ['**/*.integration.test.ts', 'node'],
      ['**/tests/unit/**', 'node'],
    ],
  },
});