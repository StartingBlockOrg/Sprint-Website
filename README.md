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

## Checks

CI runs these on every PR (`.github/workflows/ci.yml`). Run them before pushing:

```sh
npm run check          # type check
npm run build
npm run check:images   # image and video size limits
npm run check:links    # crawls the built site
npm run test:a11y      # axe in light and dark, desktop and phone, plus the theme switch
npx lhci autorun --config=lighthouserc.cjs
```

The Playwright and Lighthouse steps need Chromium: `npx playwright install chromium`, or point
`CHROMIUM_PATH` (Playwright) and `CHROME_PATH` (Lighthouse) at one already installed.

## Deploy

Every merge to `main` deploys (`.github/workflows/deploy.yml`). The repo's Pages source must be set
to GitHub Actions. The origin and base path come from the Pages settings at build time
(`site.config.mjs`), so links always go through `url()` in `src/lib/site.ts`, never a hard-coded `/`.

Moving to a custom domain needs no code change: set the domain in the repo's Pages settings (which
writes the `CNAME`), point DNS at GitHub Pages, and enable Enforce HTTPS. The next deploy builds
without the `/Sprint-Website` base path.
