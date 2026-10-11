// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteUrl, basePath, outDir } from './site.config.mjs';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  output: 'static',
  outDir,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // Every built page except the 404 goes in the sitemap, so a new post or page is listed with no code change.
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
});
