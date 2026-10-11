// @ts-check
import { defineConfig } from 'astro/config';
import { siteUrl, basePath } from './site.config.mjs';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
