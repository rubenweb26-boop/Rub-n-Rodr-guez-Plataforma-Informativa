import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['tests/platform-verification.test.ts', 'tests/e2e/**', 'node_modules/**', 'dist/**', '.next/**'],
    globals: true,
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    isolate: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
      '@/lib': path.resolve(import.meta.dirname, './lib'),
      '@/components': path.resolve(import.meta.dirname, './components'),
      '@/app': path.resolve(import.meta.dirname, './app'),
      'server-only': path.resolve(import.meta.dirname, './tests/mocks/server-only.ts'),
      'cloudflare:workers': path.resolve(import.meta.dirname, './tests/mocks/cloudflare-workers.ts'),
    },
  },
});
