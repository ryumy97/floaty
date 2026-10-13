import { expect, test, type Page } from '@playwright/test';
import {
  collectPageErrors,
  expectNotRemounted,
  expectSettled,
  runningAnimations,
  tag,
} from './helpers';

/** The Next.js demo's `/tube` example: one player shared by every page of a layout. */
const WATCH_ANCHOR = '.tube-player-anchor';
const DOCK_ANCHOR = '.tube-dock-anchor';

let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = collectPageErrors(page);
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

const player = (page: Page) => page.getByTestId('player');

async function elapsedSeconds(page: Page) {
  const [m, s] = (await player(page).getByTestId('elapsed').textContent())!.split(':');
  return Number(m) * 60 + Number(s);
}

async function openVideo(page: Page, title: RegExp) {
  await page.goto('/tube');
  await page.getByRole('link', { name: title }).click();
  await expect(page).toHaveURL(/\/tube\/watch\//);
  await expectSettled(page, 'video', WATCH_ANCHOR);
}

test('the player flies to the mini player dock and back without remounting', async ({
  page,
}) => {
  await openVideo(page, /Chasing the aurora/);
  await tag(player(page));
  await expect.poll(() => elapsedSeconds(page)).toBeGreaterThan(0);
  const before = await elapsedSeconds(page);

  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/tube$/);
  await expect.poll(() => runningAnimations(page, 'video'), { intervals: [20] }).toBe(1);
  await expectSettled(page, 'video', DOCK_ANCHOR);
  await expect(player(page)).toHaveClass(/\bmini\b/);
  await expectNotRemounted(player(page));
  expect(await elapsedSeconds(page)).toBeGreaterThanOrEqual(before);

  await page.getByRole('link', { name: 'Expand player' }).click();
  await expect(page).toHaveURL(/\/tube\/watch\/aurora$/);
  await expectSettled(page, 'video', WATCH_ANCHOR);
  await expect(player(page)).toHaveClass(/\bfull\b/);
  await expectNotRemounted(player(page));
});

test('stays in place while switching videos through a loading state', async ({ page }) => {
  await page.goto('/tube/watch/aurora');
  await expectSettled(page, 'video', WATCH_ANCHOR);

  await page.getByRole('link', { name: /Sourdough from scratch/ }).click();
  await expect(page).toHaveURL(/\/tube\/watch\/sourdough$/);
  await expect(player(page)).toContainText('Sourdough from scratch');
  await expectSettled(page, 'video', WATCH_ANCHOR);
  expect(await runningAnimations(page, 'video')).toBe(0);
});

test('animates into theater mode', async ({ page }) => {
  await page.goto('/tube/watch/tides');
  await expectSettled(page, 'video', WATCH_ANCHOR);
  const { width: before } = (await page.locator(WATCH_ANCHOR).boundingBox())!;

  await page.getByRole('button', { name: 'Theater mode' }).click();
  await expect.poll(() => runningAnimations(page, 'video'), { intervals: [20] }).toBe(1);
  await expectSettled(page, 'video', WATCH_ANCHOR);
  expect((await page.locator(WATCH_ANCHOR).boundingBox())!.width).toBeGreaterThan(before);
});

test('keeps playing on pages without a player slot until closed', async ({ page }) => {
  await openVideo(page, /Ten years of one juniper bonsai/);

  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await expect(page).toHaveURL(/\/tube\/library$/);
  await expect(page.getByRole('link', { name: /Ten years of one juniper bonsai/ })).toBeVisible();
  await expectSettled(page, 'video', DOCK_ANCHOR);

  await page.getByRole('button', { name: 'Close player' }).click();
  await expect(page.locator('[data-floaty="video"]')).toHaveAttribute(
    'data-floaty-state',
    'hidden',
  );
});
