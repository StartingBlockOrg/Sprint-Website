import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { contentRoot } from '../site.config.mjs';

// A post or page is one Markdown file; its file name (without .md) is its URL. The schemas are
// strict, so a missing, misspelt or wrongly typed field fails the build instead of shipping quietly.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: `${contentRoot}/blog` }),
  schema: z
    .strictObject({
      title: z.string().trim().min(1),
      // A day (2026-10-09) or a moment (2026-10-09T14:30:00Z). A post dated in the future
      // publishes on the first daily rebuild on or after that date.
      date: z.coerce.date(),
      draft: z.boolean().default(false),
      // A link post: the title is about another page, and `via` names where it lives.
      link: z.url({ protocol: /^https?$/ }).optional(),
      via: z.string().trim().min(1).optional(),
    })
    .refine((post) => !post.via || post.link, { message: '`via` needs a `link`', path: ['via'] }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: `${contentRoot}/pages` }),
  schema: z.strictObject({
    title: z.string().trim().min(1),
    // Adds the page to the header and footer navigation.
    nav: z.boolean(),
    description: z.string().trim().min(1).optional(),
  }),
});

export const collections = { blog, pages };
