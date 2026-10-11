// Lighthouse CI: run after `npm run build`. Serves dist with the base path and audits each page.
const { basePrefix: base } = require('./site.config.mjs');
const origin = 'http://localhost:4323';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx astro preview --port 4323 --ignore-lock',
      startServerReadyPattern: 'localhost:4323',
      url: [`${origin}${base}/`, `${origin}${base}/blog/`, `${origin}${base}/privacy/`, `${origin}${base}/404.html`],
      numberOfRuns: 1,
      settings: { preset: 'desktop', chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            'categories:performance': ['error', { minScore: 0.9 }],
          },
        },
        // The 404 page is noindex on purpose, which Lighthouse scores down.
        { matchingUrlPattern: '^(?!.*404\\.html$).*', assertions: { 'categories:seo': ['error', { minScore: 0.9 }] } },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
