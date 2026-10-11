// Open Graph cards (1200 × 630 PNG), drawn at build time: satori lays out the text, resvg rasterises it.
import { readFile } from 'node:fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1200;
const HEIGHT = 630;

// Satori reads WOFF but not WOFF2, so the cards use the static Newsreader cuts.
const fontFile = (weight: number) => readFile(`node_modules/@fontsource/newsreader/files/newsreader-latin-${weight}-normal.woff`);
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 600; style: 'normal' }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all(
    ([400, 500, 600] as const).map(async (weight) => ({ name: 'Newsreader', data: await fontFile(weight), weight, style: 'normal' as const })),
  ));

// The app icon, as in the header (src/components/Brand.astro).
const ICON = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E86A3A"/><stop offset="1" stop-color="#C9451C"/></linearGradient><clipPath id="c"><rect width="1024" height="1024" rx="230"/></clipPath></defs><g clip-path="url(#c)"><rect width="1024" height="1024" fill="url(#g)"/><g transform="translate(-32 0)" fill="none" stroke="#fff" stroke-width="72"><path d="M0 372H220A140 140 0 0 1 220 652H0"/><path d="M0 192H220A320 320 0 0 1 220 832H0" stroke-opacity=".55"/><path d="M0 12H220A500 500 0 0 1 220 1012H0" stroke-opacity=".28"/></g><circle cx="408.4" cy="380" r="40" fill="#fff"/></g></svg>',
).toString('base64')}`;

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown; [key: string]: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...props },
});

interface Card {
  title: string;
  /** A short line over the title: "Blog", a date, or nothing. */
  eyebrow?: string;
}

/** Renders a card in the app's own look: black, with the tint for the eyebrow and the end dot. */
export async function renderCard({ title, eyebrow }: Card): Promise<Uint8Array> {
  const size = title.length > 60 ? 60 : title.length > 32 ? 72 : 88;
  const tree = h('div', { width: WIDTH, height: HEIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#000', color: '#fff', fontFamily: 'Newsreader' }, [
    h('div', { display: 'flex', alignItems: 'center', gap: 20, fontSize: 40, fontWeight: 600 }, [
      h('img', { width: 64, height: 64 }, undefined, { src: ICON, width: 64, height: 64 }),
      'Sprint',
    ]),
    h('div', { display: 'flex', flexDirection: 'column', gap: 20 }, [
      eyebrow ? h('div', { fontSize: 30, fontWeight: 500, color: '#F2774D' }, eyebrow) : null,
      h('div', { fontSize: size, fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.02em' }, title),
    ]),
    h('div', { display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: 'rgba(235,235,245,.64)' }, [
      h('div', { width: 14, height: 14, borderRadius: 7, background: '#E0592B' }),
      'Sprint for iPhone and Apple Watch',
    ]),
  ]);
  const svg = await satori(tree as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts: await loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}

export const pngResponse = (png: Uint8Array) => new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
