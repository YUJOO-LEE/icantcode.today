import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/tests/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'src/types/**',
        'src/locales/**',
        'src/lib/mockStatus.ts',
        // Build-time SSR entry, executed only by scripts/prerender.mjs.
        'src/entry-server.tsx',
        // Pure route table (lazy import declarations); no branchable logic.
        'src/routes.tsx',
        // Type-only declarations.
        'src/components/game/fall-f/types.ts',
      ],
      thresholds: {
        statements: 96,
        branches: 92,
        functions: 95,
        lines: 97,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
