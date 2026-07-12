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
      // Значения — текущий измеренный минимум; поднимать по мере роста тестов.
      thresholds: {
        statements: 9,
        branches: 28,
        functions: 6,
        lines: 9,
      },
    },
  },
});
