import { expect, type Page } from '@playwright/test';

export type FloatyId = 'player' | 'counter';

export async function switchLayout(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}

export async function setDuration(page: Page, ms: number) {
  await page.getByLabel(/duration/).fill(String(ms));
}

export async function useSpring(page: Page) {
  await page.getByRole('combobox').selectOption('spring');
}

/** Largest difference in px between the visible floaty box and its active anchor. */
export function misalignment(page: Page, id: FloatyId) {
  return page.evaluate((id) => {
    const anchor = document.querySelector(`[data-floaty-anchor="${id}"]`);
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
  }, id);
}

export function runningAnimations(page: Page, id: FloatyId) {
  return page.evaluate(
    (id) =>
      document.querySelector(`[data-floaty="${id}"] > [data-floaty-content]`)?.getAnimations()
        .length ?? 0,
    id,
  );
}

export async function expectAligned(page: Page, id: FloatyId) {
  await expect.poll(() => misalignment(page, id)).toBeLessThan(1);
}

/** Waits for the transition to finish and checks the box rests on its anchor. */
export async function expectSettled(page: Page, id: FloatyId) {
  await expect.poll(() => runningAnimations(page, id)).toBe(0);
  await expect(page.locator(`[data-floaty="${id}"]`)).toHaveAttribute(
    'data-floaty-state',
    'visible',
  );
  await expectAligned(page, id);
}
