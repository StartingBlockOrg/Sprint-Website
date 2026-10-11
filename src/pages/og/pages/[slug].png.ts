import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import type { Page } from '../../../lib/content';
import { pngResponse, renderCard } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const pages = await getCollection('pages');
  return pages.map((page) => ({ params: { slug: page.id }, props: { page } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { page } = props as { page: Page };
  return pngResponse(await renderCard({ title: page.data.title }));
};
