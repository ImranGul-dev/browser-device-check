import { expect, test } from '@playwright/test';

const routes = [
  '/', '/webcam-test/', '/microphone-test/', '/speaker-test/', '/keyboard-test/', '/mouse-test/', '/touchscreen-test/', '/dead-pixel-test/', '/screen-resolution/', '/refresh-rate-test/', '/browser-info/', '/gamepad-test/', '/device-check/', '/guides/',
  '/guides/camera-microphone-permissions/', '/guides/test-camera-microphone-before-interview/', '/guides/webcam-not-working/', '/guides/microphone-not-working/',
  '/about/', '/contact/', '/contact/thanks/', '/accessibility/', '/privacy-policy/', '/cookie-policy/', '/terms-and-conditions/'
];

for (const route of routes) {
  test(`${route} renders static content and a single h1`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('{{');
  });
}

test('interactive tool asks before camera permission', async ({ page }) => {
  await page.goto('/webcam-test/');
  await expect(page.getByRole('button', { name: 'Start Webcam Test' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Webcam Test' }).click();
  await expect(page.getByText('Camera permission needed')).toBeVisible();
  await expect(page.getByRole('button', { name: /Allow Camera/ })).toBeVisible();
});

test('mobile navigation opens as a document panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
});

test('structured data uses approved launch types', async ({ page }) => {
  await page.goto('/webcam-test/');
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas).toHaveLength(1);
  const text = schemas.join(' ');
  expect(text).toContain('WebApplication');
  expect(text).toContain('BreadcrumbList');
  expect(text).not.toMatch(/FAQPage|HowTo|AggregateRating|Review|Offer/);
});

test('optional integrations are disabled by default', async ({ page }) => {
  await page.goto('/webcam-test/');
  await expect(page.locator('.publisher-ad')).toHaveCount(0);
  await expect(page.locator('script[src*="googlesyndication"]')).toHaveCount(0);
  await expect(page.locator('script[src*="google-analytics"], script[src*="googletagmanager"]')).toHaveCount(0);
});


test('keyboard test prevents Space and F5 default actions while active', async ({ page }) => {
  await page.goto('/keyboard-test/');
  await page.getByRole('button', { name: 'Start Keyboard Test' }).first().click();
  const before = page.url();
  await page.keyboard.press('Space');
  await page.keyboard.press('F5');
  await expect(page).toHaveURL(before);
  await expect(page.getByText(/Space \(" "\)/)).toBeVisible();
  await expect(page.getByText(/F5/).last()).toBeVisible();
});

test('new local diagnostic tools expose their primary actions', async ({ page }) => {
  await page.goto('/screen-resolution/');
  await expect(page.getByRole('button', { name: 'Check My Display' })).toBeVisible();
  await page.goto('/refresh-rate-test/');
  await expect(page.getByRole('button', { name: 'Start Refresh Rate Test' })).toBeVisible();
  await page.goto('/browser-info/');
  await expect(page.getByRole('button', { name: 'Check Browser Information' })).toBeVisible();
  await page.goto('/gamepad-test/');
  await expect(page.getByRole('button', { name: 'Start Controller Test' })).toBeVisible();
});

test('legacy terms route redirects to the approved route', async ({ page }) => {
  await page.goto('/terms/');
  await expect(page).toHaveURL(/\/terms-and-conditions\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Terms and Conditions' })).toBeVisible();
});

test('unknown route returns the custom 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('keyboard test preserves normal Tab navigation and has an exit control', async ({ page }) => {
  await page.goto('/keyboard-test/');
  await page.getByRole('button', { name: 'Start Keyboard Test' }).first().click();
  await expect(page.getByRole('button', { name: 'Exit Keyboard Test' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Refocus Keyboard Test' })).toBeFocused();
});


test('contact form uses the approved static FormSubmit endpoint', async ({ page }) => {
  await page.goto('/contact/');
  const form = page.locator('form.contact-form');
  await expect(form).toHaveAttribute('method', 'POST');
  await expect(form).toHaveAttribute('action', 'https://formsubmit.co/gulimran980@gmail.com');
  await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible();
});
