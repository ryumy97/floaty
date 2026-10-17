import { expect, type Page, test } from '@playwright/test';
import { collectPageErrors, expectNotRemounted, expectSettled, tag } from './helpers';

/** The Next.js demo's multi-page examples, listed on its home page; one describe per example. */

let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = collectPageErrors(page);
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test('the home page links every example', async ({ page }) => {
  await page.goto('/');
  for (const href of ['/tube', '/gallery', '/homes', '/acme', '/dashboard', '/shop']) {
    await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
  }
});

test.describe('gallery', () => {
  const photo = (page: Page, id: string) => page.getByTestId(`photo-${id}`);

  test('opens a photo in the intercepted modal and flies it back on close', async ({ page }) => {
    await page.goto('/gallery');
    await expectSettled(page, 'photo-salt');
    await tag(photo(page, 'salt'));

    const layerZ = (id: string) =>
      page.locator(`[data-floaty="${id}"]`).evaluate((el) => el.parentElement!.style.zIndex);

    await page.getByRole('link', { name: 'Open Salt flats at dusk' }).click();
    await expect(page).toHaveURL(/\/gallery\/photo\/salt$/);
    await expectSettled(page, 'photo-salt', '.gal-modal-anchor');
    await expect(layerZ('photo-salt')).resolves.toBe('1100');
    await expect(layerZ('photo-harbor')).resolves.toBe('1000');
    await photo(page, 'salt').getByRole('button', { name: '♡ Like' }).click();

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/gallery$/);
    await expect(page.locator('.gal-modal')).toHaveCount(0);
    await expectSettled(page, 'photo-salt', '.gal-cell[data-floaty-anchor="photo-salt"]');
    await expect(photo(page, 'salt').getByLabel('Liked')).toBeVisible();
    await expectNotRemounted(photo(page, 'salt'));
  });

  test('moves between photos inside the modal', async ({ page }) => {
    await page.goto('/gallery');
    await page.getByRole('link', { name: 'Open Salt flats at dusk' }).click();
    await expectSettled(page, 'photo-salt', '.gal-modal-anchor');

    const layerZ = (id: string) =>
      page.locator(`[data-floaty="${id}"]`).evaluate((el) => el.parentElement!.style.zIndex);

    await photo(page, 'salt').getByRole('link', { name: 'Next photo' }).click();
    await expect(page).toHaveURL(/\/gallery\/photo\/harbor$/);
    // Incoming photo on top; outgoing stays raised above the grid while it closes.
    await expect(layerZ('photo-harbor')).resolves.toBe('1100');
    await expectSettled(page, 'photo-harbor', '.gal-modal-anchor');
    await expectSettled(page, 'photo-salt', '.gal-cell[data-floaty-anchor="photo-salt"]');
    await expect(layerZ('photo-salt')).resolves.toBe('1000');
  });

  test('renders the photo page on a full page load', async ({ page }) => {
    await page.goto('/gallery/photo/salt');
    await expect(page.locator('.gal-modal')).toHaveCount(0);
    await expectSettled(page, 'photo-salt', '.gal-page-anchor');

    await page.getByRole('link', { name: '← Back to gallery' }).click();
    await expectSettled(page, 'photo-salt', '.gal-cell[data-floaty-anchor="photo-salt"]');
  });

  test('flies from the modal to the detail page without remounting', async ({ page }) => {
    await page.goto('/gallery');
    await expectSettled(page, 'photo-salt');
    await tag(photo(page, 'salt'));

    await page.getByRole('link', { name: 'Open Salt flats at dusk' }).click();
    await expectSettled(page, 'photo-salt', '.gal-modal-anchor');
    await photo(page, 'salt').getByRole('button', { name: '♡ Like' }).click();

    await photo(page, 'salt').getByRole('link', { name: 'Open page' }).click();
    await expect(page).toHaveURL(/\/gallery\/view\/salt$/);
    await expect(page.locator('.gal-modal')).toHaveCount(0);
    await expectSettled(page, 'photo-salt', '.gal-page-anchor');
    await expect(photo(page, 'salt')).toHaveClass(/\bpage\b/);
    await expect(photo(page, 'salt').getByLabel('Liked')).toBeVisible();
    await expectNotRemounted(photo(page, 'salt'));

    await page.getByRole('link', { name: '← Back to gallery' }).click();
    await expectSettled(page, 'photo-salt', '.gal-cell[data-floaty-anchor="photo-salt"]');
    await expectNotRemounted(photo(page, 'salt'));
  });
});

test.describe('homes', () => {
  test('keeps the map view across pages and focuses the preview', async ({ page }) => {
    const map = page.getByTestId('homes-map');
    await page.goto('/homes');
    await expectSettled(page, 'homes-map');
    await tag(map);
    await map.getByRole('button', { name: 'Zoom in' }).click();
    await expect(map).toHaveAttribute('data-zoom', '1.40');

    await page.getByRole('link', { name: 'Map', exact: true }).click();
    await expect(page).toHaveURL(/\/homes\/map$/);
    await expectSettled(page, 'homes-map');
    await expect(map).toHaveAttribute('data-zoom', '1.40');

    await map.getByRole('link', { name: '$990K' }).click();
    await expect(page).toHaveURL(/\/homes\/mill-7\?from=map$/);
    await expectSettled(page, 'homes-map');
    await expect(map).toHaveClass(/\bpreview\b/);
    await expect(map).toHaveAttribute('data-zoom', '1.80');

    await page.getByRole('link', { name: '← Back to results' }).click();
    await expect(page).toHaveURL(/\/homes\/map$/);
    await expectSettled(page, 'homes-map');
    await expect(map).toHaveAttribute('data-zoom', '1.40');
    await expectNotRemounted(map);
  });

  test('flies a listing item from the list into the detail page', async ({ page }) => {
    await page.goto('/homes');
    const item = page.getByTestId('homes-listing-mill-7');
    await expectSettled(page, 'homes-listing-mill-7');
    await tag(item);
    await expect(item).toHaveClass(/\bcard\b/);

    const layerZ = (id: string) =>
      page.locator(`[data-floaty="${id}"]`).evaluate((el) => el.parentElement!.style.zIndex);

    await page.getByRole('link', { name: '7 Mill Road' }).click();
    await expect(page).toHaveURL(/\/homes\/mill-7\?from=list$/);
    await expectSettled(page, 'homes-listing-mill-7');
    await expect(item).toHaveClass(/\bdetail\b/);
    await expect(item.getByText('Open house this Saturday')).toBeVisible();
    await expect(layerZ('homes-listing-mill-7')).resolves.toBe('1100');
    // Other listings use keepMounted={false} so they unmount off the list
    // (otherwise abspos ghosts extend document scroll on some detail pages).
    await expect(page.locator('[data-floaty="homes-listing-elm-12"]')).toHaveCount(0);
    await expectNotRemounted(item);

    await page.getByRole('link', { name: '← Back to results' }).click();
    await expect(page).toHaveURL(/\/homes$/);
    await expectSettled(page, 'homes-listing-mill-7');
    await expect(item).toHaveClass(/\bcard\b/);
    await expectNotRemounted(item);
  });
});

test.describe('support chat', () => {
  const chat = (page: Page) => page.getByTestId('chat');

  test('keeps the conversation and the draft from the dock to the support page', async ({
    page,
  }) => {
    await page.goto('/acme');
    await expectSettled(page, 'support-chat', '.chat-dock-anchor');
    await chat(page).getByRole('button', { name: 'Open chat' }).click();
    await expect(chat(page)).toHaveClass(/\bpanel\b/);

    const input = chat(page).getByLabel('Message');
    await input.fill('What does the pricing look like?');
    await input.press('Enter');
    await expect(chat(page).locator('.chat-message')).toHaveCount(3);
    await input.fill('half-typed draft');

    await page.getByRole('link', { name: 'Docs', exact: true }).click();
    await expect(page).toHaveURL(/\/acme\/docs$/);
    await expectSettled(page, 'support-chat', '.chat-dock-anchor');

    await chat(page).getByRole('link', { name: 'Expand chat' }).click();
    await expect(page).toHaveURL(/\/acme\/support$/);
    await expectSettled(page, 'support-chat', '.chat-page-anchor');
    await expect(chat(page).locator('.chat-message')).toHaveCount(3);
    await expect(input).toHaveValue('half-typed draft');
  });

  test('animates between the bubble and the panel, counting unread replies', async ({ page }) => {
    await page.goto('/acme/pricing');
    await page.getByRole('button', { name: 'Talk to sales' }).click();
    await expectSettled(page, 'support-chat', '.chat-dock-anchor');
    const panelWidth = (await page.locator('.chat-dock-anchor').boundingBox())!.width;
    expect(panelWidth).toBeGreaterThan(300);

    const input = chat(page).getByLabel('Message');
    await input.fill('hello');
    await input.press('Enter');
    await chat(page).getByRole('button', { name: 'Minimize chat' }).click();
    await expect(chat(page)).toHaveClass(/\bbubble\b/);
    await expectSettled(page, 'support-chat', '.chat-dock-anchor');
    expect((await page.locator('.chat-dock-anchor').boundingBox())!.width).toBe(60);
    await expect(chat(page).locator('.chat-unread')).toHaveText('1');
  });
});

test.describe('dashboard', () => {
  test('widgets move between the grid, the detail page and the rail', async ({ page }) => {
    const latency = page.getByTestId('widget-latency');
    await page.goto('/dashboard');
    await expectSettled(page, 'widget-latency');
    await tag(latency);

    await page.getByRole('link', { name: 'Open API latency (p95)' }).click();
    await expect(page).toHaveURL(/\/dashboard\/latency$/);
    await expectSettled(page, 'widget-latency');
    await expectSettled(page, 'widget-revenue');
    await expect(latency).toHaveClass(/\blarge\b/);

    await page.getByTestId('widget-revenue').locator('.dash-rail').click();
    await expect(page).toHaveURL(/\/dashboard\/revenue$/);
    await expectSettled(page, 'widget-revenue');
    await expectSettled(page, 'widget-latency');
    await expect(latency).toHaveClass(/\brail\b/);
    await expectNotRemounted(latency);
  });
});

test.describe('shop', () => {
  test('the order summary travels from the header through checkout', async ({ page }) => {
    const summary = page.getByTestId('order-summary');
    await page.goto('/shop');
    await expectSettled(page, 'order-summary', '.shop-pill-anchor');
    await tag(summary);
    await page.locator('.shop-product', { hasText: 'Wool throw' }).getByRole('button').click();
    await expect(summary.getByTestId('pill-count')).toHaveText('2');

    await summary.locator('.shop-pill').click();
    await expect(page).toHaveURL(/\/shop\/cart$/);
    await expectSettled(page, 'order-summary', '.shop-summary-anchor');
    await summary.getByLabel('Coupon code').fill('floaty20');
    await summary.getByRole('button', { name: 'Apply' }).click();
    await expect(summary.getByTestId('summary-total')).toHaveText('$167.20');

    await summary.getByRole('link', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/shop\/checkout\/shipping$/);
    await expectSettled(page, 'order-summary', '.shop-summary-anchor');
    await page.getByLabel('Full name').fill('Ada Lovelace');
    await page.getByLabel('Address').fill('12 St James Square, London');
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    await expect(page).toHaveURL(/\/shop\/checkout\/payment$/);
    await expectSettled(page, 'order-summary', '.shop-summary-anchor');
    await page.getByLabel('Card number').fill('4242 4242 4242 4242');
    await page.getByRole('button', { name: 'Pay $167.20' }).click();

    await expect(page).toHaveURL(/\/shop\/checkout\/done$/);
    await expectSettled(page, 'order-summary', '.shop-summary-anchor');
    await expect(summary).toContainText('confirmed');
    await expect(summary.getByTestId('summary-total')).toHaveText('$167.20');

    await summary.getByRole('button', { name: 'Continue shopping' }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expectSettled(page, 'order-summary', '.shop-pill-anchor');
    await expect(summary.getByTestId('pill-count')).toHaveText('0');
    await expectNotRemounted(summary);
  });
});
