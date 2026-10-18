import { defineConfig, devices } from '@playwright/test';

/**
 * Each demo app runs its own specs, on its production build: the Vite demo is the one-page
 * playground, the Next.js demo has the multi-page examples.
 */
const DEMOS = [
  { name: 'vite', filter: '@ryumy97/floaty-demo-vite', port: 5199, testMatch: ['floaty.spec.ts'] },
  {
    name: 'next',
    filter: '@ryumy97/floaty-demo-next',
    port: 5200,
    testMatch: ['navigation.spec.ts', 'examples.spec.ts'],
  },
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
  projects: DEMOS.map(({ name, port, testMatch }) => ({
    name,
    testMatch,
    use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}` },
  })),
  webServer: DEMOS.map(({ filter, port }) => ({
    command: `pnpm --filter ${filter} start`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  })),
});
