import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{js,ts,mjs}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', 'node_modules/**', 'src/**/*.test.ts'],
      // Гейт покрытия: CI (npm run test:unit:coverage) падает при просадке.
      // Значения — измеренный минимум (2026-08: 14.75/54.14/25.58) с запасом;
      // поднимать по мере роста тестов.
      thresholds: {
        statements: 13,
        branches: 48,
        functions: 22,
        lines: 13,
      },
    },
  },
});
