import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getPosts, postUrl, sourceName } from '../lib/content';
import { site, url } from '../lib/site';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site: origin }) => {
  const posts = await getPosts();
  const absolute = (path: string) => new URL(path, origin).href;
  return rss({
    title: `${site.name} blog`,
    description: 'Notes from building Sprint, and links worth reading about running fast.',
    site: absolute(url('/')),
    items: posts.map((post) => {
      const { title, date, link } = post.data;
      const source = link ? `<p><a href="${escape(link)}">↗ ${escape(sourceName(post) ?? '')}</a></p>` : '';
      return { title, pubDate: date, link: absolute(postUrl(post)), content: source + (post.rendered?.html ?? '') };
    }),
    customData: '<language>en-gb</language>',
  });
};
