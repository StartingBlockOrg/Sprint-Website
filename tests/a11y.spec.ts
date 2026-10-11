import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'home', path: './' },
  { name: 'blog', path: 'blog/' },
  { name: 'privacy', path: 'privacy/' },
  { name: '404', path: '404.html' },
];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const { name, path } of pages) {
      test(`${name} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  });
}

test('the theme switch overrides the system theme and is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await bg()).toBe('rgb(255, 255, 255)');

  await page.getByRole('button', { name: 'Dark' }).click();
  expect(await bg()).toBe('rgb(0, 0, 0)');
  await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  expect(await bg()).toBe('rgb(0, 0, 0)');

  await page.getByRole('button', { name: 'Auto' }).click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  expect(await bg()).toBe('rgb(255, 255, 255)');
});

test('the system dark scheme applies without JS', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('./');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(0, 0, 0)');
  await expect(page.getByRole('group', { name: 'Theme' })).toBeHidden();
  await context.close();
});

test('until the listing exists, the App Store button is plain text with no badge', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.store')).toHaveCount(0);
  await expect(page.locator('img[src$="download-on-the-app-store.svg"]')).toHaveCount(0);
  await expect(page.locator('.soon')).toHaveText(['Coming soon to the App Store', 'Coming soon to the App Store']);
});
