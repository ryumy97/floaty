import { defineConfig, devices } from '@playwright/test';

/** The same specs run against every demo app, on its production build. */
const DEMOS = [
  { name: 'vite', filter: '@floaty/demo-vite', port: 5199 },
  { name: 'next', filter: '@floaty/demo-next', port: 5200 },
];

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    reducedMotion: 'no-preference',
    trace: 'retain-on-failure',
  },
  projects: DEMOS.map(({ name, port }) => ({
    name,
    use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}` },
  })),
  webServer: DEMOS.map(({ filter, port }) => ({
    command: `pnpm --filter ${filter} start`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  })),
});
