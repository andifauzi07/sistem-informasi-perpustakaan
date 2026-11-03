import { defineConfig, devices } from '@playwright/test'

// Lima proyek = bukti Portability (NFR-PO-01).
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
    { name: 'iPhone 14', use: { ...devices['iPhone 14'] } },
  ],
})
