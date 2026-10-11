// The blog and generic pages, tested against the fixture build (npm run build:fixtures), whose posts
// and pages live in tests/fixtures/content and never reach the production build.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { basePrefix as base } from '../site.config.mjs';

const fixtures = `http://localhost:4324${base}/`;
test.use({ baseURL: fixtures });

const titles = async (page: import('@playwright/test').Page) => page.locator('.post-title').allTextContents();

test('the production blog ships empty, with an empty state', async ({ page }) => {
  await page.goto(`http://localhost:4321${base}/blog/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
  await expect(page.getByText('No posts yet.')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
});

test('the index lists live posts newest first, grouped by day', async ({ page }) => {
  await page.goto('blog/');
  expect(await titles(page)).toEqual([
    'Fixture same-day post',
    'Fixture link post: a page elsewhere',
    'Fixture post ending in a list',
    'Fixture first post',
  ]);
  await expect(page.locator('.day')).toHaveText(['Tuesday 6 October 2026', 'Tuesday 29 September 2026', 'Tuesday 8 September 2026']);
  await expect(page.locator('.day-group').first().locator('article')).toHaveCount(2);
  await expect(page.locator('.blog-end')).toHaveText('That’s every post. The first one was in September 2026.');
});

test('drafts and future-dated posts are not built', async ({ page, request }) => {
  await page.goto('blog/');
  expect(await titles(page)).not.toContain('Fixture draft');
  expect(await titles(page)).not.toContain('Fixture future post');
  expect((await request.get('blog/fixture-draft/')).status()).toBe(404);
  expect((await request.get('blog/fixture-future/')).status()).toBe(404);
});

test('a post title opens the post page', async ({ page }) => {
  await page.goto('blog/');
  await page.getByRole('link', { name: 'Fixture first post' }).click();
  await expect(page).toHaveURL(`${fixtures}blog/fixture-first-post/`);
  await expect(page).toHaveTitle('Fixture first post · Sprint');
  await expect(page.getByRole('heading', { level: 1, name: 'Fixture first post' })).toBeVisible();
  await expect(page.locator('.day')).toHaveText('Tuesday 8 September 2026');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.getByRole('link', { name: '← All posts' }).first()).toHaveAttribute('href', `${base}/blog/`);
});

test('a link post links to its source, named by via or the host name', async ({ page }) => {
  await page.goto('blog/');
  await expect(page.locator('.post .src')).toHaveText(['↗ example.org', '↗ example.com']);
  await expect(page.getByRole('link', { name: 'example.com' })).toHaveAttribute('href', 'https://example.com/a-page');
});

test('the end dot closes a post only when it ends with a paragraph', async ({ page }) => {
  await page.goto('blog/');
  const dot = (title: string) =>
    page
      .locator('article', { has: page.getByRole('heading', { name: title }) })
      .locator('.prose > :last-child')
      .evaluate((el) => getComputedStyle(el, '::after').content);
  expect(await dot('Fixture first post')).toBe('""');
  expect(await dot('Fixture post ending in a list')).toBe('none');
});

test('a page file becomes a page, and a nav entry when nav is true', async ({ page }) => {
  await page.goto('fixture-page/');
  await expect(page).toHaveTitle('Fixture page · Sprint');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'A generic page from the fixtures.');
  await expect(page.getByRole('navigation', { name: 'Footer' }).getByRole('link')).toHaveText(['Blog', 'Fixture page']);
  // The header lists pages only on wider screens; the footer always does.
  await expect(page.locator('.site-nav a', { hasText: 'Fixture page' })).toHaveAttribute('aria-current', 'page');

  await page.goto('fixture-unlisted/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fixture unlisted page' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fixture unlisted page' })).toHaveCount(0);
});

test('posts and pages are in the sitemap; drafts and the 404 are not', async ({ request }) => {
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  for (const path of ['blog/', 'blog/fixture-first-post/', 'blog/fixture-link-post/', 'fixture-page/', 'fixture-unlisted/']) {
    expect(sitemap).toContain(`${base}/${path}<`);
  }
  expect(sitemap).not.toContain('fixture-draft');
  expect(sitemap).not.toContain('fixture-future');
  expect(sitemap).not.toContain('404');
});

test('the RSS feed carries the live posts with their content', async ({ request }) => {
  const res = await request.get('rss.xml');
  expect(res.headers()['content-type']).toContain('xml');
  const feed = await res.text();
  expect(feed.match(/<item>/g)).toHaveLength(4);
  expect(feed).toContain(`${base}/blog/fixture-first-post/</link>`);
  expect(feed).toContain('The last paragraph of a post ends with the dot.');
  expect(feed).not.toContain('Fixture draft');
  expect(feed).not.toContain('Fixture future post');
});

test('every post and page has its own Open Graph image', async ({ page, request }) => {
  for (const path of ['blog/fixture-first-post/', 'fixture-page/', 'blog/']) {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    const res = await request.get(new URL(image!).pathname.replace(`${base}/`, ''));
    expect(res.status(), image!).toBe(200);
    expect(res.headers()['content-type']).toBe('image/png');
  }
});

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });
    for (const path of ['blog/', 'blog/fixture-link-post/', 'fixture-page/']) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  });
}
