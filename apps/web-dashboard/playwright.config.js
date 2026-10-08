import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60000,
  outputDir: '../../.tmp/doctor-browser-results',
  use: {
    baseURL: 'http://127.0.0.1:5299',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5299 --strictPort',
    url: 'http://127.0.0.1:5299',
    timeout: 60000,
    reuseExistingServer: false,
    env: { VITE_API_URL: process.env.VITE_API_URL ?? 'http://127.0.0.1:3299' },
  },
});
