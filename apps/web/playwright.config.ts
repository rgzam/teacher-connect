import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const root = path.join(__dirname, '../..');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: process.env.CI ? 'pnpm --filter api start' : 'pnpm --filter api dev',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      cwd: root,
      timeout: 120_000,
    },
    {
      command: process.env.CI ? 'pnpm --filter web start' : 'pnpm --filter web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: root,
      timeout: 120_000,
    },
  ],
});
