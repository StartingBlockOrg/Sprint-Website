import { getCollection, type CollectionEntry } from 'astro:content';
import { url } from './site';

export type Post = CollectionEntry<'blog'>;
export type Page = CollectionEntry<'pages'>;

/** Posts that are live at build time: not drafts and not dated in the future. Newest first. */
export async function getPosts(): Promise<Post[]> {
  const now = Date.now();
  const posts = await getCollection('blog', ({ data }) => !data.draft && data.date.getTime() <= now);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

/** Pages listed in the navigation, in file-name order. */
export async function getNavPages(): Promise<Page[]> {
  const pages = await getCollection('pages', ({ data }) => data.nav);
  return pages.sort((a, b) => a.id.localeCompare(b.id));
}

export const postUrl = (post: Post) => url(`/blog/${post.id}/`);

/** What a link post's source line says: its `via`, or the link's host name. */
export const sourceName = ({ data: { link, via } }: Post) => via ?? (link && new URL(link).hostname.replace(/^www\./, ''));
export const pageUrl = (page: Page) => url(`/${page.id}/`);

// Dates are days, written in UTC by the YAML parser, so they are read back in UTC.
const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "Friday 9 October 2026", the heading over each day's posts. */
export const formatDay = (date: Date) => dayFormat.format(date).replace(',', '');
export const formatMonth = (date: Date) => monthFormat.format(date);
export const isoDay = dayKey;

/** Groups posts (already newest first) by the day they were published. */
export function groupByDay(posts: Post[]): { day: Date; posts: Post[] }[] {
  const groups: { day: Date; posts: Post[] }[] = [];
  for (const post of posts) {
    const last = groups.at(-1);
    if (last && dayKey(last.day) === dayKey(post.data.date)) last.posts.push(post);
    else groups.push({ day: post.data.date, posts: [post] });
  }
  return groups;
}
