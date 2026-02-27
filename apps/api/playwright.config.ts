import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.e2e-spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  outputDir: '/tmp/playwright-api-output',
  use: {
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
