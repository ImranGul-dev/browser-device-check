import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/webcam-test/',
  '/microphone-test/',
  '/speaker-test/',
  '/keyboard-test/',
  '/mouse-test/',
  '/touchscreen-test/',
  '/dead-pixel-test/',
  '/screen-resolution/',
  '/refresh-rate-test/',
  '/browser-info/',
  '/gamepad-test/',
  '/device-check/',
  '/guides/',
  '/guides/camera-microphone-permissions/',
  '/guides/test-camera-microphone-before-interview/',
  '/guides/webcam-not-working/',
  '/guides/microphone-not-working/',
  '/about/',
  '/contact/',
  '/contact/thanks/',
  '/accessibility/',
  '/privacy-policy/',
  '/cookie-policy/',
  '/terms-and-conditions/',
];

for (const route of routes) {
  test(`${route} has no detectable serious or critical axe violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
