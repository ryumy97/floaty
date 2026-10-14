import { expect, type Page, test } from '@playwright/test';
import {
  expectAligned,
  expectSettled,
  misalignment,
  runningAnimations,
  setDuration,
  switchLayout,
  useSpring,
} from './helpers';

let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  // Catches hydration mismatches and runtime errors, which only reach the console.
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });
  await page.goto('/');
  await expectSettled(page, 'player');
  await expectSettled(page, 'counter');
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test.describe('positioning', () => {
  test('rests exactly on its anchors', async ({ page }) => {
    expect(await misalignment(page, 'player')).toBeLessThan(1);
    expect(await misalignment(page, 'counter')).toBeLessThan(1);
  });

  test('keeps component state across layouts', async ({ page }) => {
    const counter = page.locator('[data-floaty="counter"]');
    await counter.getByRole('button').click();
    await counter.getByRole('button').click();
    await expect(counter.locator('.count')).toHaveText('2');

    await switchLayout(page, 'list');
    await expectSettled(page, 'counter');
    await expect(counter.locator('.count')).toHaveText('2');
  });

  test('follows anchors moved by a sibling that neither resizes nor re-renders them', async ({
    page,
  }) => {
    await switchLayout(page, 'list');
    await expectSettled(page, 'counter');
    const before = await page
      .locator('[data-floaty-anchor="counter"]')
      .evaluate((el) => el.getBoundingClientRect().y);

    await page.getByRole('button', { name: 'Expand this row' }).click();
    const after = await page
      .locator('[data-floaty-anchor="counter"]')
      .evaluate((el) => el.getBoundingClientRect().y);
    expect(after - before).toBeGreaterThan(150);

    await expectSettled(page, 'counter');
    await expectSettled(page, 'player');
  });

  test('follows a layout shift caused by a viewport resize', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 800 });
    await expectSettled(page, 'player');
    await expectSettled(page, 'counter');
  });
});

test.describe('transitions', () => {
  test('easing animates the gap and lands on the new anchor', async ({ page }) => {
    await setDuration(page, 1500);
    await switchLayout(page, 'list');

    expect(await runningAnimations(page, 'player')).toBe(1);
    await expect(page.locator('[data-floaty="player"]')).toHaveAttribute(
      'data-floaty-state',
      'animating',
    );
    expect(await misalignment(page, 'player')).toBeGreaterThan(5);
    await expectSettled(page, 'player');
  });

  test('springs play sampled keyframes and land exactly on the anchor', async ({ page }) => {
    await useSpring(page);
    await setDuration(page, 600);
    await switchLayout(page, 'list');

    const timing = await page.evaluate(() => {
      const [animation] = document
        .querySelector('[data-floaty="player"] > [data-floaty-content]')!
        .getAnimations();
      const effect = animation.effect as KeyframeEffect;
      return { keyframes: effect.getKeyframes().length, easing: effect.getTiming().easing };
    });
    expect(timing.easing).toBe('linear');
    expect(timing.keyframes).toBeGreaterThan(2);
    await expectSettled(page, 'player');
  });
});

test.describe('scrolling', () => {
  test('page scroll moves content natively, with no frame of lag', async ({ page }) => {
    await switchLayout(page, 'list');
    await expectSettled(page, 'player');

    const result = await page.evaluate(() => {
      const outer = document.querySelector<HTMLElement>('[data-floaty="player"]')!;
      const inner = outer.querySelector('[data-floaty-content]')!;
      const anchor = document.querySelector('[data-floaty-anchor="player"]')!;
      const transformBefore = outer.style.transform;
      window.scrollBy(0, 400);
      // Same task as the scroll: no rAF or re-measure has run yet.
      const a = anchor.getBoundingClientRect();
      const b = inner.getBoundingClientRect();
      return {
        scrolled: window.scrollY,
        gap: Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
        transformBefore,
      };
    });
    expect(result.scrolled).toBeGreaterThan(0);
    expect(result.gap).toBeLessThan(1);

    await page.waitForTimeout(100);
    const transformAfter = await page
      .locator('[data-floaty="player"]')
      .evaluate((el: HTMLElement) => el.style.transform);
    expect(transformAfter).toBe(result.transformBefore);
  });

  test('anchors in fixed containers stay aligned with no frame of lag', async ({ page }) => {
    await switchLayout(page, 'dock');
    await expectSettled(page, 'player');
    await expect(page.locator('[data-floaty="player"]')).toHaveCSS('position', 'fixed');

    const gap = await page.evaluate(() => {
      const inner = document.querySelector('[data-floaty="player"] > [data-floaty-content]')!;
      const anchor = document.querySelector('[data-floaty-anchor="player"]')!;
      window.scrollBy(0, 400);
      const a = anchor.getBoundingClientRect();
      const b = inner.getBoundingClientRect();
      return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    });
    expect(gap).toBeLessThan(1);
    await expectAligned(page, 'counter');
  });

  test('animates between page and fixed anchors after scrolling', async ({ page }) => {
    await switchLayout(page, 'list');
    await expectSettled(page, 'player');
    await page.evaluate(() => window.scrollBy(0, 300));
    await switchLayout(page, 'dock');
    expect(await runningAnimations(page, 'player')).toBe(1);
    await expectSettled(page, 'player');

    await switchLayout(page, 'grid');
    await expectSettled(page, 'player');
    await expect(page.locator('[data-floaty="player"]')).toHaveCSS('position', 'absolute');
  });

  test('follows page scroll at rest', async ({ page }) => {
    await switchLayout(page, 'list');
    await expectSettled(page, 'player');

    await page.evaluate(() => window.scrollBy(0, 400));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expectAligned(page, 'player');
    await expectAligned(page, 'counter');
  });

  test('scrolling mid-transition keeps the same animation', async ({ page }) => {
    await setDuration(page, 1500);
    await switchLayout(page, 'list');

    await page.evaluate(() => {
      const inner = document.querySelector('[data-floaty="player"] > [data-floaty-content]')!;
      (window as unknown as { started: Animation }).started = inner.getAnimations()[0];
      window.scrollBy(0, 300);
    });
    await page.waitForTimeout(150);

    const sameAnimation = await page.evaluate(() => {
      const inner = document.querySelector('[data-floaty="player"] > [data-floaty-content]')!;
      const [current] = inner.getAnimations();
      const { started } = window as unknown as { started: Animation };
      return current === started && current.playState === 'running';
    });
    expect(sameAnimation).toBe(true);
    await expectSettled(page, 'player');
  });

  test('follows anchors inside a nested scroll container', async ({ page }) => {
    await switchLayout(page, 'scroll box');
    await expectSettled(page, 'player');

    await page.getByTestId('scroll-box').evaluate((el) => {
      el.scrollTop = 250;
    });
    await expectAligned(page, 'player');
    await expectAligned(page, 'counter');
  });

  test('follows sticky sidebar anchors', async ({ page }) => {
    await switchLayout(page, 'sidebar');
    await expectSettled(page, 'player');

    await page.evaluate(() => window.scrollBy(0, 600));
    await expectAligned(page, 'player');
    await expectAligned(page, 'counter');
  });
});

test.describe('content form during transitions', () => {
  const player = (page: Page) => page.locator('[data-floaty="player"] .card.player');

  test('switches form at take-off by default', async ({ page }) => {
    await setDuration(page, 1500);
    await switchLayout(page, 'sidebar');
    await expect.poll(() => runningAnimations(page, 'player')).toBe(1);
    await expect(player(page)).toHaveClass(/\bmini\b/);
  });

  test('can keep the old form until landing with settledState', async ({ page }) => {
    await page.getByLabel('player switches form on landing').check();
    await setDuration(page, 1500);
    await switchLayout(page, 'sidebar');
    await expect.poll(() => runningAnimations(page, 'player')).toBe(1);
    await expect(player(page)).toHaveClass(/\bfull\b/);

    await expectSettled(page, 'player');
    await expect(player(page)).toHaveClass(/\bmini\b/);
  });
});

test.describe('anchors mounting in a later commit', () => {
  test('animates into an anchor that mounts one commit later', async ({ page }) => {
    await setDuration(page, 1500);
    await switchLayout(page, 'deferred');
    await expect(page.locator('[data-floaty-anchor="player"]')).toBeVisible();

    await expect.poll(() => runningAnimations(page, 'player'), { timeout: 1000 }).toBe(1);
    await expectSettled(page, 'player');
  });

  test('hides once the grace period passes without a new anchor', async ({ page }) => {
    await switchLayout(page, 'hidden');
    await expect(page.locator('[data-floaty="player"]')).toHaveAttribute(
      'data-floaty-state',
      'hidden',
    );
  });
});
