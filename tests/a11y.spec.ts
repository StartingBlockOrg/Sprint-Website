import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'home', path: './' },
  { name: 'blog', path: 'blog/' },
  { name: 'privacy', path: 'privacy/' },
  { name: 'support', path: 'support/' },
  { name: 'terms', path: 'terms/' },
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

test('the App Store badge links to the live listing, in the header and the hero', async ({ page }) => {
  await page.goto('./');
  const listing = 'https://apps.apple.com/gb/app/sprint-watch-sprint-tracker/id6820784230';
  const badges = page.getByRole('link', { name: 'Download on the App Store' });
  await expect(badges).toHaveCount(2);
  for (const badge of await badges.all()) await expect(badge).toHaveAttribute('href', listing);
  await expect(page.locator('.soon')).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'App Store' })).toHaveAttribute('href', listing);
});

test('the home page shows the iPhone and Apple Watch screenshot, described', async ({ page }) => {
  await page.goto('./');
  const shot = page.locator('.hero-shot');
  await expect(shot).toHaveCount(1);
  await expect(shot).toHaveAttribute('alt', /Apple Watch.*iPhone/);
  await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});
