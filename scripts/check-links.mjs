// Builds nothing: run after `npm run build`. Serves dist through `astro preview` (which applies the
// base path) and crawls every page. Links to the production origin are rewritten to the local server,
// so canonical and Open Graph URLs are checked against what this build would deploy.
// With CONTENT_FIXTURES=1 it checks the fixture build in dist-fixtures instead, skipping the fixtures'
// made-up external links.
import { spawn } from 'node:child_process';
import { LinkChecker } from 'linkinator';
import { siteUrl as site, basePrefix as base, fixtures } from '../site.config.mjs';

const PORT = 4322;
const local = `http://localhost:${PORT}`;
const start = `${local}${base}/`;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Run Astro's own binary (not through npx) so killing the child stops the server.
const astro = new URL('../node_modules/astro/bin/astro.mjs', import.meta.url).pathname;
const server = spawn(process.execPath, [astro, 'preview', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(start);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server did not start at ${start}`);
}

try {
  await waitForServer();
  // One crawl per start page: given several paths at once, linkinator stops following links.
  const links = [];
  for (const path of [start, `${start}404.html`]) {
    const result = await new LinkChecker().check({
      path,
      recurse: true,
      retry: true,
      retryErrors: true,
      retryErrorsCount: 2,
      // Skipping runs before the rewrite below, so links to the site's own origin must not be skipped.
      linksToSkip: async (href) => fixtures && !href.startsWith(local) && !href.startsWith(site),
      urlRewriteExpressions: [{ pattern: new RegExp(`^${escape(site)}`), replacement: local }],
    });
    links.push(...result.links);
  }
  const broken = links.filter((link) => link.state === 'BROKEN');
  if (process.env.VERBOSE) for (const link of links) console.log(link.state, link.status, link.url);
  for (const link of broken) console.error(`BROKEN ${link.status ?? ''} ${link.url} (on ${link.parent})`);
  console.log(`${new Set(links.map((link) => link.url)).size} links checked, ${broken.length} broken.`);
  process.exitCode = broken.length ? 1 : 0;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  stop();
}
