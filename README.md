# Sprint website

The website for Sprint, the Apple Watch and iPhone app for track sprint training. Astro, static output,
deployed to GitHub Pages. Work comes from the Website 1.0 project in Linear (team WEB); one PR per issue
into `main`. The design and motion come from the web canvas pinned on that project.

## Run it

Node 22.12 or later.

```sh
npm ci
npm run dev        # http://localhost:4321/Sprint-Website/
```

## Posts and pages

A post or page is one Markdown file, added in GitHub's web editor (Add file → Create new file) or
with `npm run new-post -- "The title"`. The file name is the URL: `src/content/blog/wind-legal.md`
is `/blog/wind-legal/`. Merging the PR publishes it, with its RSS item, sitemap entry and Open Graph
image; nothing else needs touching.

```md
---
title: Wind-legal, explained
date: 2026-10-09
draft: false                      # optional; true keeps it unpublished
link: https://example.com/page    # optional: makes it a link post
via: example.com                  # optional, needs link; defaults to the link's host name
---

The post, in Markdown. Use ### for subheadings.
```

A post dated in the future goes live on the first daily rebuild (05:17 UTC) on or after its date.
Pages go in `src/content/pages/` with a `title`, `nav: true` or `nav: false` (listed in the header and
footer or not) and an optional `description` for search results. Fields are checked: a missing,
misspelt or wrongly typed one fails the PR's checks, with the file and field named.

The blog ships empty. Tests build the site a second time from `tests/fixtures/content`
(`npm run build:fixtures`, into `dist-fixtures`), so fixture posts never reach production.

## Checks

CI runs these on every PR (`.github/workflows/ci.yml`). Run them before pushing:

```sh
npm run check:content         # frontmatter schema
npm run check                 # type check
npm run build
npm run build:fixtures        # the same site from the test fixtures
npm run check:images          # image and video size limits
npm run check:links           # crawls the built site
npm run check:links:fixtures  # crawls the fixture build
npm run test:a11y             # axe in light and dark, desktop and phone, the theme switch, the blog
npx lhci autorun --config=lighthouserc.cjs
```

The Playwright and Lighthouse steps need Chromium: `npx playwright install chromium`, or point
`CHROMIUM_PATH` (Playwright) and `CHROME_PATH` (Lighthouse) at one already installed.

## Deploy

Every merge to `main` deploys (`.github/workflows/deploy.yml`), and so does a daily run that
publishes future-dated posts. GitHub pauses scheduled workflows after 60 days without a commit; re-enable
it from the Actions tab if that happens. The repo's Pages source must be set
to GitHub Actions. The origin and base path come from the Pages settings at build time
(`site.config.mjs`), so links always go through `url()` in `src/lib/site.ts`, never a hard-coded `/`.

Moving to a custom domain needs no code change: set the domain in the repo's Pages settings (which
writes the `CNAME`), point DNS at GitHub Pages, and enable Enforce HTTPS. The next deploy builds
without the `/Sprint-Website` base path.
