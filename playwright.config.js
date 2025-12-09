// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // 1. Point to your tests folder
  testDir: './tests',

  // 2. Run everything serially (one by one)
  fullyParallel: false,
  workers: 1,

  // 3. Global Timeouts (60 seconds per test)
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  // 4. Reporting
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  // 5. Test Settings
  use: {
    baseURL: 'https://ecommerce-playground.lambdatest.io',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    headless: false, // Set to true if you don't want to see the browser
  },

  // 6. Browser Configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});