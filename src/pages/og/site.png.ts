import type { APIRoute } from 'astro';
import { pngResponse, renderCard } from '../../lib/og';

export const GET: APIRoute = async () => pngResponse(await renderCard({ title: 'Track sprint training, timed from your wrist.' }));
