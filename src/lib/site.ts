export const site = {
  name: 'Sprint',
  description: 'Sprint for iPhone and Apple Watch: track sprint training, timed from your wrist.',
  // Null until the App Store listing exists; the App Store button shows its "coming soon" state.
  appStoreUrl: null as string | null,
};

/** Prefixes a site path with the configured base path, so links survive the move to a custom domain. */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}
