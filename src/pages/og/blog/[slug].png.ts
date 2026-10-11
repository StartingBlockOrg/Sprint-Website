import type { APIRoute, GetStaticPaths } from 'astro';
import { formatDay, getPosts, type Post } from '../../../lib/content';
import { pngResponse, renderCard } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Post };
  return pngResponse(await renderCard({ title: post.data.title, eyebrow: formatDay(post.data.date) }));
};
