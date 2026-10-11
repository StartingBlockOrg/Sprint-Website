// Writes a new blog post from the template: npm run new-post -- "The title" [--link https://… --via example.com]
// The file name becomes the post's URL. Edit the body, then open a PR; the post goes live when it merges
// (or, if you change the date to a later day, on the first daily rebuild on or after it).
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { link: { type: 'string' }, via: { type: 'string' }, date: { type: 'string' } },
});
const title = positionals.join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-post -- "The title" [--link URL] [--via example.com] [--date YYYY-MM-DD]');
  process.exit(1);
}
if (values.via && !values.link) {
  console.error('--via names the site a --link points to; pass --link too.');
  process.exit(1);
}

const date = values.date ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD, not "${date}".`);
  process.exit(1);
}
const slug = title
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const path = `src/content/blog/${slug}.md`;
if (existsSync(path)) {
  console.error(`${path} already exists.`);
  process.exit(1);
}

// JSON strings are valid YAML, so titles with colons or quotes need no special care.
const frontmatter = [
  `title: ${JSON.stringify(title)}`,
  `date: ${date}`,
  'draft: false',
  values.link && `link: ${JSON.stringify(values.link)}`,
  values.via && `via: ${JSON.stringify(values.via)}`,
].filter(Boolean);

const body = `The first paragraph.

### A subheading, if the post needs one

The last paragraph ends with the dot.
`;

await writeFile(path, `---\n${frontmatter.join('\n')}\n---\n\n${body}`);
console.log(`Wrote ${path}`);
