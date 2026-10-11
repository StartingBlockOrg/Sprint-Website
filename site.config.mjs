// Where the site is served. The deploy workflow passes the values that actions/configure-pages
// reports: the github.io origin and `/Sprint-Website` today, the custom domain and `/` once one is set
// in the repo's Pages settings. Locally and in PR checks the defaults match today's address.
export const siteUrl = (process.env.SITE_URL || 'https://startingblockorg.github.io').replace(/\/$/, '');
export const basePath = process.env.BASE_PATH || '/Sprint-Website';
/** The base path without a trailing slash, for building local URLs ('' at the root). */
export const basePrefix = basePath.replace(/\/$/, '');
