import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.js',
  workers: 1,
  timeout: 60000,
  outputDir: '../../.tmp/patient-browser-results',
  use: {
    baseURL: 'http://127.0.0.1:8083',
    viewport: { width: 390, height: 844 },
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start -- --web --host localhost --port 8083',
    url: 'http://127.0.0.1:8083',
    timeout: 180000,
    reuseExistingServer: false,
    env: {
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      EXPO_OFFLINE: '1',
      NODE_OPTIONS: '--dns-result-order=ipv4first',
      EXPO_PUBLIC_API_URL:
        process.env.PATIENT_TEST_API_URL ?? 'http://127.0.0.1:3299',
    },
  },
});
