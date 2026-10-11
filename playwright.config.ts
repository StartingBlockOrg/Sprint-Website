import { defineConfig, devices } from '@playwright/test';
import { basePrefix as base } from './site.config.mjs';

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:4321${base}/`,
    // Lets a machine with a preinstalled Chromium skip `playwright install`.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npx astro preview --port 4321 --ignore-lock',
    url: `http://localhost:4321${base}/`,
    reuseExistingServer: !process.env.CI,
  },
});
