// Builds nothing: run after `npm run build`. Serves dist through `astro preview` (which applies the
// base path) and crawls every page. Links to the production origin are rewritten to the local server,
// so canonical and Open Graph URLs are checked against what this build would deploy.
import { spawn } from 'node:child_process';
import { LinkChecker } from 'linkinator';
import { siteUrl as site, basePrefix as base } from '../site.config.mjs';

const PORT = 4322;
const local = `http://localhost:${PORT}`;
const start = `${local}${base}/`;

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
  const checker = new LinkChecker();
  const result = await checker.check({
    path: [start, `${start}404.html`],
    recurse: true,
    retry: true,
    retryErrors: true,
    retryErrorsCount: 2,
    urlRewriteExpressions: [{ pattern: new RegExp(`^${site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), replacement: local }],
  });
  const broken = result.links.filter((link) => link.state === 'BROKEN');
  if (process.env.VERBOSE) for (const link of result.links) console.log(link.state, link.status, link.url);
  for (const link of broken) console.error(`BROKEN ${link.status ?? ''} ${link.url} (on ${link.parent})`);
  console.log(`${result.links.length} links checked, ${broken.length} broken.`);
  process.exitCode = result.passed ? 0 : 1;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  stop();
}
