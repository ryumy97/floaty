import { expect, type Locator, type Page } from '@playwright/test';

/** The Vite playground's ids, or any id used by the Next.js demo's examples. */
export type FloatyId = 'player' | 'counter' | (string & {});

/** Collects page errors and `console.error`s, which is how hydration mismatches surface. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/** Tags the element, so a later check can tell whether it was remounted in between. */
export function tag(locator: Locator) {
  return locator.evaluate((el) => el.setAttribute('data-test-tag', 'original'));
}

export async function expectNotRemounted(locator: Locator) {
  await expect(locator).toHaveAttribute('data-test-tag', 'original');
}

export async function switchLayout(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}

export async function setDuration(page: Page, ms: number) {
  await page.getByLabel(/duration/).fill(String(ms));
}

export async function useSpring(page: Page) {
  await page.getByRole('combobox').selectOption('spring');
}

/**
 * Largest difference in px between the visible floaty box and its active anchor, which is
 * the first anchor for `id` unless `anchor` selects another one.
 */
export function misalignment(page: Page, id: FloatyId, anchor?: string) {
  return page.evaluate(
    ([id, selector]) => {
      const anchor = document.querySelector(selector ?? `[data-floaty-anchor="${id}"]`);
      const box = document.querySelector(`[data-floaty="${id}"] > [data-floaty-content]`);
      if (!anchor || !box) return Infinity;
      const a = anchor.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y),
        Math.abs(a.width - b.width),
        Math.abs(a.height - b.height),
      );
    },
    [id, anchor] as const,
  );
}

export function runningAnimations(page: Page, id: FloatyId) {
  return page.evaluate(
    (id) =>
      document.querySelector(`[data-floaty="${id}"] > [data-floaty-content]`)?.getAnimations()
        .length ?? 0,
    id,
  );
}

export async function expectAligned(page: Page, id: FloatyId, anchor?: string) {
  await expect.poll(() => misalignment(page, id, anchor)).toBeLessThan(1);
}

/** Waits for the transition to finish and checks the box rests on its anchor. */
export async function expectSettled(page: Page, id: FloatyId, anchor?: string) {
  await expect.poll(() => runningAnimations(page, id)).toBe(0);
  await expect(page.locator(`[data-floaty="${id}"]`)).toHaveAttribute(
    'data-floaty-state',
    'visible',
  );
  await expectAligned(page, id, anchor);
}
